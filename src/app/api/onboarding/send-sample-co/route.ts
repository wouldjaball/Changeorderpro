import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateApprovalToken } from "@/lib/tokens";
import { sendEmail, emailApprovalRequest } from "@/lib/resend";

const SAMPLE_TITLE = "Add outlet near kitchen island";
const SAMPLE_DESCRIPTION =
  "Customer requested one additional 20-amp outlet, including wiring and a drywall patch.";
const SAMPLE_LABOR_HOURS = 2;
const SAMPLE_MATERIALS_AMOUNT = 45;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("users")
    .select("company_id, full_name, email")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json(
      { error: "No company linked to this account" },
      { status: 400 }
    );
  }

  const { data: company } = await admin
    .from("companies")
    .select("name, logo_url, settings")
    .eq("id", profile.company_id)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const rate =
    Number(company.settings?.default_labor_rate) > 0
      ? Number(company.settings.default_labor_rate)
      : 85;
  const laborAmount = rate * SAMPLE_LABOR_HOURS;
  const total = laborAmount + SAMPLE_MATERIALS_AMOUNT;
  const projectName = "Sample Project (Demo)";

  const projectId = crypto.randomUUID();
  const { error: projectError } = await admin.from("projects").insert({
    id: projectId,
    company_id: profile.company_id,
    name: projectName,
    client_name: profile.full_name,
    client_email: profile.email,
    status: "active",
    created_by: user.id,
  });

  if (projectError) {
    return NextResponse.json(
      { error: "Failed to create sample project: " + projectError.message },
      { status: 500 }
    );
  }

  const { data: coNumber } = await admin.rpc("generate_co_number", {
    p_company_id: profile.company_id,
  });
  const finalCoNumber = coNumber || `CO-${Date.now()}`;

  const coId = crypto.randomUUID();
  const { error: coError } = await admin.from("change_orders").insert({
    id: coId,
    company_id: profile.company_id,
    project_id: projectId,
    co_number: finalCoNumber,
    title: SAMPLE_TITLE,
    description: SAMPLE_DESCRIPTION,
    pricing_type: "fixed",
    fixed_amount: total,
    total_amount: total,
    status: "draft",
    created_by: user.id,
  });

  if (coError) {
    return NextResponse.json(
      { error: "Failed to create sample change order: " + coError.message },
      { status: 500 }
    );
  }

  await admin.from("co_line_items").insert([
    {
      change_order_id: coId,
      description: "Labor",
      quantity: SAMPLE_LABOR_HOURS,
      unit: "hours",
      rate,
      amount: laborAmount,
      item_type: "labor",
      sort_order: 0,
    },
    {
      change_order_id: coId,
      description: "Materials",
      quantity: 1,
      unit: "job",
      rate: SAMPLE_MATERIALS_AMOUNT,
      amount: SAMPLE_MATERIALS_AMOUNT,
      item_type: "materials",
      sort_order: 1,
    },
  ]);

  const { token, expiresAt } = generateApprovalToken();
  const approvalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/approve/${token}`;

  await admin
    .from("change_orders")
    .update({
      approval_token: token,
      approval_token_expires_at: expiresAt.toISOString(),
      approval_method: "email",
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", coId);

  const { subject, html } = emailApprovalRequest({
    companyName: company.name,
    companyLogo: company.logo_url || undefined,
    coNumber: finalCoNumber,
    projectName,
    coTitle: SAMPLE_TITLE,
    description: SAMPLE_DESCRIPTION,
    amount: total.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    pricingType: "fixed",
    approvalLink: approvalUrl,
  });

  try {
    const result = await sendEmail({ to: profile.email, subject, html });
    await admin.from("notifications_log").insert({
      change_order_id: coId,
      company_id: profile.company_id,
      channel: "email",
      recipient: profile.email,
      template_type: "approval_request",
      external_id: result.id,
      status: "sent",
    });
  } catch (err) {
    await admin.from("notifications_log").insert({
      change_order_id: coId,
      company_id: profile.company_id,
      channel: "email",
      recipient: profile.email,
      template_type: "approval_request",
      status: "failed",
      error_message: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to send sample change order email" },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, recipient: profile.email });
}
