import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateApprovalToken } from "@/lib/tokens";
import { smsApprovalRequest } from "@/lib/sms";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: co, error: coError } = await supabase
    .from("change_orders")
    .select(
      "id, company_id, co_number, title, status, approval_token, approval_token_expires_at, project:projects(client_phone)"
    )
    .eq("id", id)
    .single();

  if (coError || !co) {
    return NextResponse.json(
      { error: "Change order not found" },
      { status: 404 }
    );
  }

  if (!["draft", "declined", "sent"].includes(co.status)) {
    return NextResponse.json(
      { error: "Change order cannot be sent in its current status" },
      { status: 400 }
    );
  }

  type ProjectPhone = { client_phone: string | null };
  const projectRelation = co.project as unknown as
    | ProjectPhone
    | ProjectPhone[]
    | null;
  const project = Array.isArray(projectRelation)
    ? (projectRelation[0] ?? null)
    : projectRelation;

  const existingTokenStillLive =
    !!co.approval_token &&
    !!co.approval_token_expires_at &&
    new Date(co.approval_token_expires_at) > new Date();

  let token: string;

  if (existingTokenStillLive) {
    token = co.approval_token as string;
  } else {
    const generated = generateApprovalToken();
    token = generated.token;

    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("change_orders")
      .update({
        approval_token: generated.token,
        approval_token_expires_at: generated.expiresAt.toISOString(),
      })
      .eq("id", co.id)
      .eq("company_id", co.company_id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to prepare approval link" },
        { status: 500 }
      );
    }
  }

  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", co.company_id)
    .single();

  const approvalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/approve/${token}`;
  const smsBody = smsApprovalRequest({
    companyName: company?.name || "Your contractor",
    coNumber: co.co_number,
    coTitle: co.title,
    approvalLink: approvalUrl,
  });

  return NextResponse.json({
    approvalUrl,
    smsBody,
    clientPhone: project?.client_phone ?? null,
  });
}
