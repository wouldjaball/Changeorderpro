import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateApprovalToken, freshExpiry } from "@/lib/tokens";
import { smsApprovalRequest, smsTMApprovalRequest } from "@/lib/sms";
import { sendEmail, emailApprovalRequest } from "@/lib/resend";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { changeOrderId, method } = body as {
    changeOrderId: string;
    method: "sms" | "email" | "link" | "both";
  };

  if (!changeOrderId || !method) {
    return NextResponse.json(
      { error: "Missing changeOrderId or method" },
      { status: 400 }
    );
  }

  // Fetch CO with project and company
  const { data: co, error: coError } = await supabase
    .from("change_orders")
    .select("*, project:projects(*)")
    .eq("id", changeOrderId)
    .single();

  if (coError || !co) {
    return NextResponse.json(
      { error: "Change order not found" },
      { status: 404 }
    );
  }

  if (!["draft", "declined", "sent"].includes(co.status)) {
    return NextResponse.json(
      { error: "Change order cannot be resent in its current status" },
      { status: 400 }
    );
  }

  const project = co.project && !Array.isArray(co.project) ? co.project : null;
  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  // Get company info
  const { data: company } = await supabase
    .from("companies")
    .select("name, logo_url, phone")
    .eq("id", co.company_id)
    .single();

  // Fetch photos for email
  const { data: photos } = await supabase
    .from("co_photos")
    .select("annotated_url, original_url")
    .eq("change_order_id", co.id);

  const photoUrls = photos
    ?.map((p) => p.annotated_url || p.original_url)
    .filter(Boolean) as string[] | undefined;

  // Reuse the existing approval token on a resend as long as it's still live —
  // the client may already have that link in an email or text thread, and
  // regenerating it on every resend silently breaks any copy they haven't
  // clicked yet. Only mint a fresh token for a genuinely new send (draft/
  // declined) or once the previous one has actually expired.
  const existingTokenStillLive =
    co.status === "sent" &&
    !!co.approval_token &&
    !!co.approval_token_expires_at &&
    new Date(co.approval_token_expires_at) > new Date();

  const { token, expiresAt } = existingTokenStillLive
    ? { token: co.approval_token as string, expiresAt: freshExpiry() }
    : generateApprovalToken();
  const approvalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/approve/${token}`;

  // Use admin client for writes that bypass RLS (approval_events, etc.)
  const admin = createAdminClient();

  // Update CO with token, method, and sent status
  await admin
    .from("change_orders")
    .update({
      approval_token: token,
      approval_token_expires_at: expiresAt.toISOString(),
      approval_method: method,
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", co.id);

  const amount = Number(co.total_amount || co.fixed_amount || 0).toLocaleString(
    undefined,
    { minimumFractionDigits: 2 }
  );

  // Send via selected channels
  const notifications: Promise<void>[] = [];

  // SMS — not sent server-side. We just compose the message and log intent;
  // the client opens the contractor's own phone's texting app to actually send it.
  let smsBody: string | undefined;
  if ((method === "sms" || method === "both") && project.client_phone) {
    smsBody =
      co.pricing_type === "tm"
        ? smsTMApprovalRequest({
            companyName: company?.name || "Your contractor",
            coNumber: co.co_number,
            projectName: project.name,
            coTitle: co.title,
            amount,
            rate: "varies",
            approvalLink: approvalUrl,
          })
        : smsApprovalRequest({
            companyName: company?.name || "Your contractor",
            coNumber: co.co_number,
            projectName: project.name,
            coTitle: co.title,
            amount,
            approvalLink: approvalUrl,
          });

    notifications.push(
      (async () => {
        await admin.from("notifications_log").insert({
          change_order_id: co.id,
          company_id: co.company_id,
          channel: "sms",
          recipient: project.client_phone,
          template_type: "approval_request",
          status: "link_generated",
        });
      })()
    );
  }

  // Email — send to primary + additional emails
  const allEmails: string[] = [];
  if (project.client_email) allEmails.push(project.client_email);
  if (project.client_emails && Array.isArray(project.client_emails)) {
    for (const e of project.client_emails) {
      if (e && !allEmails.includes(e)) allEmails.push(e);
    }
  }

  if ((method === "email" || method === "both") && allEmails.length > 0) {
    const { subject, html } = emailApprovalRequest({
      companyName: company?.name || "Your contractor",
      companyLogo: company?.logo_url || undefined,
      coNumber: co.co_number,
      projectName: project.name,
      coTitle: co.title,
      description: co.description || undefined,
      amount,
      pricingType: co.pricing_type,
      approvalLink: approvalUrl,
      photoUrls,
    });

    for (const recipient of allEmails) {
      const emailPromise = (async () => {
        try {
          const result = await sendEmail({
            to: recipient,
            subject,
            html,
          });

          await admin.from("notifications_log").insert({
            change_order_id: co.id,
            company_id: co.company_id,
            channel: "email",
            recipient,
            template_type: "approval_request",
            external_id: result.id,
            status: "sent",
          });
        } catch (err) {
          await admin.from("notifications_log").insert({
            change_order_id: co.id,
            company_id: co.company_id,
            channel: "email",
            recipient,
            template_type: "approval_request",
            status: "failed",
            error_message: err instanceof Error ? err.message : "Unknown error",
          });
        }
      })();
      notifications.push(emailPromise);
    }
  }

  // Log audit event
  await admin.from("audit_log").insert({
    company_id: co.company_id,
    user_id: user.id,
    action: "sent",
    table_name: "change_orders",
    record_id: co.id,
    new_data: { method, sent_at: new Date().toISOString() },
  });

  // Wait for notifications to complete
  await Promise.allSettled(notifications);

  return NextResponse.json({
    success: true,
    approvalUrl,
    smsBody,
    clientPhone: smsBody ? project.client_phone : undefined,
  });
}
