import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateApprovalToken } from "@/lib/tokens";
import { sendSMS, smsApprovalRequest, smsTMApprovalRequest } from "@/lib/twilio";
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

  // Generate approval token
  const { token, expiresAt } = generateApprovalToken();
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

  // SMS
  if ((method === "sms" || method === "both") && project.client_phone) {
    const smsPromise = (async () => {
      const smsTemplate =
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

      try {
        const result = await sendSMS({
          to: project.client_phone!,
          body: smsTemplate,
        });

        await admin.from("notifications_log").insert({
          change_order_id: co.id,
          company_id: co.company_id,
          channel: "sms",
          recipient: project.client_phone!,
          template_type: "approval_request",
          external_id: result.sid,
          status: "sent",
        });
      } catch (err) {
        await admin.from("notifications_log").insert({
          change_order_id: co.id,
          company_id: co.company_id,
          channel: "sms",
          recipient: project.client_phone!,
          template_type: "approval_request",
          status: "failed",
          error_message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    })();
    notifications.push(smsPromise);
  }

  // Email
  if ((method === "email" || method === "both") && project.client_email) {
    const emailPromise = (async () => {
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

      try {
        const result = await sendEmail({
          to: project.client_email!,
          subject,
          html,
        });

        await admin.from("notifications_log").insert({
          change_order_id: co.id,
          company_id: co.company_id,
          channel: "email",
          recipient: project.client_email!,
          template_type: "approval_request",
          external_id: result.id,
          status: "sent",
        });
      } catch (err) {
        await admin.from("notifications_log").insert({
          change_order_id: co.id,
          company_id: co.company_id,
          channel: "email",
          recipient: project.client_email!,
          template_type: "approval_request",
          status: "failed",
          error_message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    })();
    notifications.push(emailPromise);
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
    approvalUrl: method === "link" ? approvalUrl : undefined,
  });
}
