import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTokenValid } from "@/lib/tokens";
import { sendEmail, emailApprovalConfirmation } from "@/lib/resend";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, changeOrderId, companyId, action, clientNameTyped } = body as {
    token: string;
    changeOrderId: string;
    companyId: string;
    action: "approved" | "declined";
    clientNameTyped: string | null;
  };

  if (!token || !changeOrderId || !action) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch the CO to validate token
  const { data: co, error } = await supabase
    .from("change_orders")
    .select("*, project:projects(client_email, client_name)")
    .eq("id", changeOrderId)
    .eq("approval_token", token)
    .single();

  if (error || !co) {
    return NextResponse.json({ error: "Invalid token or change order" }, { status: 404 });
  }

  // Validate token
  const validation = isTokenValid(token, co.approval_token_expires_at, co.status);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }

  // Collect client metadata
  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                    headersList.get("x-real-ip") ||
                    "unknown";
  const userAgent = headersList.get("user-agent") || "unknown";

  // Create approval event (immutable record)
  await supabase.from("approval_events").insert({
    change_order_id: changeOrderId,
    company_id: companyId,
    action,
    method: "link",
    ip_address: ipAddress !== "unknown" ? ipAddress : null,
    user_agent: userAgent,
    client_name_typed: clientNameTyped,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  });

  // Update CO status
  const updateData: Record<string, unknown> = {
    status: action,
  };
  if (action === "approved") {
    updateData.approved_at = new Date().toISOString();
  } else {
    updateData.declined_at = new Date().toISOString();
  }

  await supabase.from("change_orders").update(updateData).eq("id", changeOrderId);

  // Get company info for confirmation emails
  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .single();

  const project = co.project && !Array.isArray(co.project) ? co.project : null;
  const amount = Number(co.total_amount || co.fixed_amount || 0).toLocaleString(
    undefined,
    { minimumFractionDigits: 2 }
  );

  // Send confirmation email to client
  if (project?.client_email) {
    try {
      const { subject, html } = emailApprovalConfirmation({
        companyName: company?.name || "Your contractor",
        coNumber: co.co_number,
        coTitle: co.title,
        amount,
        action,
      });

      const result = await sendEmail({
        to: project.client_email,
        subject,
        html,
      });

      await supabase.from("notifications_log").insert({
        change_order_id: changeOrderId,
        company_id: companyId,
        channel: "email",
        recipient: project.client_email,
        template_type: `${action}_confirmation`,
        external_id: result.id,
        status: "sent",
      });
    } catch {
      // Don't fail the approval if email fails
    }
  }

  // Send notification to PM/team members
  const { data: teamMembers } = await supabase
    .from("users")
    .select("email")
    .eq("company_id", companyId)
    .in("role", ["admin", "pm"]);

  if (teamMembers) {
    for (const member of teamMembers) {
      try {
        const { subject, html } = emailApprovalConfirmation({
          companyName: company?.name || "Your company",
          coNumber: co.co_number,
          coTitle: co.title,
          amount,
          action,
        });

        await sendEmail({
          to: member.email,
          subject: `[${action.toUpperCase()}] ${subject}`,
          html,
        });
      } catch {
        // Don't fail if team notifications fail
      }
    }
  }

  return NextResponse.json({ success: true, action });
}
