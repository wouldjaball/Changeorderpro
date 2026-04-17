import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSMS, smsReminder } from "@/lib/twilio";
import { sendEmail } from "@/lib/resend";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * POST /api/cron/reminders
 *
 * Called by Vercel Cron (hourly) to check for COs awaiting approval
 * and send reminder notifications. Also handles escalation after 48h.
 *
 * Auth: Vercel auto-sends Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: NextRequest) {
  // Validate cron secret
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const results: { reminders: number; escalations: number; errors: string[] } = {
    reminders: 0,
    escalations: 0,
    errors: [],
  };

  // Fetch all COs in "sent" status
  const { data: pendingCOs, error } = await supabase
    .from("change_orders")
    .select("*, project:projects(client_name, client_email, client_emails, client_phone, name)")
    .eq("status", "sent")
    .not("sent_at", "is", null);

  if (error || !pendingCOs) {
    return NextResponse.json({ error: "Failed to fetch COs" }, { status: 500 });
  }

  for (const co of pendingCOs) {
    const project = co.project && !Array.isArray(co.project) ? co.project : null;
    if (!project) continue;

    const sentAt = new Date(co.sent_at);
    const hoursSinceSent = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60);

    // Get company settings for reminder window
    const { data: company } = await supabase
      .from("companies")
      .select("name, phone, settings")
      .eq("id", co.company_id)
      .single();

    const reminderHours = company?.settings?.reminder_hours || 24;

    // Count existing reminders for this CO
    const { count: reminderCount } = await supabase
      .from("notifications_log")
      .select("*", { count: "exact", head: true })
      .eq("change_order_id", co.id)
      .eq("template_type", "reminder");

    const remindersAlreadySent = reminderCount || 0;

    // Escalation: 48h+ with 2+ reminders already sent
    if (hoursSinceSent >= 48 && remindersAlreadySent >= 2) {
      // Send escalation to team
      const { data: teamMembers } = await supabase
        .from("users")
        .select("email, full_name")
        .eq("company_id", co.company_id)
        .in("role", ["admin", "pm"]);

      if (teamMembers) {
        for (const member of teamMembers) {
          try {
            await sendEmail({
              to: member.email,
              subject: `[ESCALATION] ${co.co_number} — No response after 48h`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #dc2626;">Escalation: No Client Response</h2>
                  <p>Change Order <strong>${co.co_number}</strong> — "${co.title}" has been awaiting approval for over 48 hours with no response from ${project.client_name || "the client"}.</p>
                  <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 16px 0;">
                    <p style="margin: 0;"><strong>Project:</strong> ${project.name}</p>
                    <p style="margin: 4px 0 0;"><strong>Amount:</strong> $${Number(co.total_amount || co.fixed_amount || 0).toLocaleString()}</p>
                    <p style="margin: 4px 0 0;"><strong>Sent:</strong> ${sentAt.toLocaleDateString()}</p>
                    <p style="margin: 4px 0 0;"><strong>Reminders sent:</strong> ${remindersAlreadySent}</p>
                  </div>
                  <p>Consider following up directly with the client.</p>
                </div>
              `,
            });
          } catch {
            results.errors.push(`Escalation email to ${member.email} failed`);
          }
        }
      }

      // Log escalation event
      await supabase.from("approval_events").insert({
        change_order_id: co.id,
        company_id: co.company_id,
        action: "reminder_sent",
        method: "email",
        metadata: { type: "escalation", hours_since_sent: hoursSinceSent },
      });

      results.escalations++;
      continue;
    }

    // Reminder: check if enough time has passed since last reminder (or since sent)
    if (hoursSinceSent < reminderHours) continue;

    // Don't send more than 2 reminders
    if (remindersAlreadySent >= 2) continue;

    // Check time since last reminder
    if (remindersAlreadySent > 0) {
      const { data: lastReminder } = await supabase
        .from("notifications_log")
        .select("created_at")
        .eq("change_order_id", co.id)
        .eq("template_type", "reminder")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (lastReminder) {
        const hoursSinceLastReminder =
          (now.getTime() - new Date(lastReminder.created_at).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastReminder < reminderHours) continue;
      }
    }

    // Build approval link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const approvalLink = `${appUrl}/approve/${co.approval_token}`;

    // Send reminder via SMS
    if (project.client_phone && (co.approval_method === "sms" || co.approval_method === "both")) {
      try {
        const body = smsReminder({
          coNumber: co.co_number,
          companyName: company?.name || "Your contractor",
          approvalLink,
        });
        const smsResult = await sendSMS({ to: project.client_phone, body });

        await supabase.from("notifications_log").insert({
          change_order_id: co.id,
          company_id: co.company_id,
          channel: "sms",
          recipient: project.client_phone,
          template_type: "reminder",
          external_id: smsResult.sid,
          status: "sent",
        });
      } catch {
        results.errors.push(`SMS reminder for ${co.co_number} failed`);
      }
    }

    // Send reminder via email — to all client emails
    const reminderEmails: string[] = [];
    if (project.client_email) reminderEmails.push(project.client_email);
    if (project.client_emails && Array.isArray(project.client_emails)) {
      for (const e of project.client_emails) {
        if (e && !reminderEmails.includes(e)) reminderEmails.push(e);
      }
    }

    if (reminderEmails.length > 0 && (co.approval_method === "email" || co.approval_method === "both")) {
      for (const recipient of reminderEmails) {
        try {
          const emailResult = await sendEmail({
            to: recipient,
            subject: `Reminder: Change Order #${co.co_number} awaiting your approval`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Reminder: Approval Needed</h2>
                <p>Change Order <strong>#${co.co_number}</strong> — "${co.title}" from ${company?.name || "your contractor"} is still awaiting your response.</p>
                <div style="text-align: center; margin: 24px 0;">
                  <a href="${approvalLink}" style="background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Review & Approve</a>
                </div>
                <p style="color: #666; font-size: 14px;">Amount: $${Number(co.total_amount || co.fixed_amount || 0).toLocaleString()}</p>
              </div>
            `,
          });

          await supabase.from("notifications_log").insert({
            change_order_id: co.id,
            company_id: co.company_id,
            channel: "email",
            recipient,
            template_type: "reminder",
            external_id: emailResult.id,
            status: "sent",
          });
        } catch {
          results.errors.push(`Email reminder for ${co.co_number} to ${recipient} failed`);
        }
      }
    }

    // Log reminder event
    await supabase.from("approval_events").insert({
      change_order_id: co.id,
      company_id: co.company_id,
      action: "reminder_sent",
      method: co.approval_method || "link",
      metadata: { reminder_number: remindersAlreadySent + 1, hours_since_sent: hoursSinceSent },
    });

    results.reminders++;
  }

  return NextResponse.json({
    success: true,
    processed: pendingCOs.length,
    ...results,
  });
}
