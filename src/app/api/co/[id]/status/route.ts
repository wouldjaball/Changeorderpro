import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { COStatus } from "@/types";

const ALLOWED_TRANSITIONS: Record<string, COStatus[]> = {
  approved: ["paid", "archived"],
  invoiced: ["paid", "archived"],
  draft: ["archived"],
  sent: ["archived"],
  declined: ["archived"],
  void: ["archived"],
  paid: ["archived"],
};

const TIMESTAMP_COLUMN: Partial<Record<COStatus, string>> = {
  paid: "paid_at",
  archived: "archived_at",
};

export async function PATCH(
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

  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: "No company" }, { status: 403 });
  }

  const body = await request.json();
  const nextStatus = body?.status as COStatus | undefined;

  if (nextStatus !== "paid" && nextStatus !== "archived") {
    return NextResponse.json(
      { error: "status must be 'paid' or 'archived'" },
      { status: 400 }
    );
  }

  const { data: co, error: coError } = await supabase
    .from("change_orders")
    .select("*")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .single();

  if (coError || !co) {
    return NextResponse.json({ error: "Change order not found" }, { status: 404 });
  }

  const allowed = ALLOWED_TRANSITIONS[co.status] || [];
  if (!allowed.includes(nextStatus)) {
    return NextResponse.json(
      { error: `Cannot mark a "${co.status}" change order as "${nextStatus}"` },
      { status: 400 }
    );
  }

  const timestampColumn = TIMESTAMP_COLUMN[nextStatus];
  const updates: Record<string, unknown> = {
    status: nextStatus,
    ...(timestampColumn ? { [timestampColumn]: new Date().toISOString() } : {}),
  };

  const { error: updateError } = await supabase
    .from("change_orders")
    .update(updates)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update: " + updateError.message },
      { status: 500 }
    );
  }

  const admin = createAdminClient();
  await admin.from("audit_log").insert({
    company_id: profile.company_id,
    user_id: user.id,
    action: "status_changed",
    table_name: "change_orders",
    record_id: id,
    old_data: { status: co.status },
    new_data: updates,
  });

  return NextResponse.json({ success: true });
}
