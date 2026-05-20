import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PricingType, LineItemType } from "@/types";

const EDITABLE_STATUSES = ["draft", "sent", "declined"];

interface LineItemPayload {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  item_type: LineItemType;
}

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

  const { data: co, error: coError } = await supabase
    .from("change_orders")
    .select("*")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .single();

  if (coError || !co) {
    return NextResponse.json({ error: "Change order not found" }, { status: 404 });
  }

  if (!EDITABLE_STATUSES.includes(co.status)) {
    return NextResponse.json(
      { error: `Cannot edit a change order with status "${co.status}"` },
      { status: 400 }
    );
  }

  const body = await request.json();
  const {
    title,
    description,
    pricing_type,
    fixed_amount,
    internal_notes,
    start_date,
    completion_date,
    line_items,
  } = body as {
    title?: string;
    description?: string | null;
    pricing_type?: PricingType;
    fixed_amount?: number | null;
    internal_notes?: string | null;
    start_date?: string | null;
    completion_date?: string | null;
    line_items?: LineItemPayload[];
  };

  const oldSnapshot = { ...co };

  const updates: Record<string, unknown> = {
    edit_count: (co.edit_count || 0) + 1,
    last_edited_at: new Date().toISOString(),
    last_edited_by: user.id,
  };

  if (co.status === "sent") {
    updates.status = "draft";
    updates.approval_token = null;
    updates.approval_token_expires_at = null;
  }

  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description || null;
  if (pricing_type !== undefined) updates.pricing_type = pricing_type;
  if (fixed_amount !== undefined) updates.fixed_amount = fixed_amount;
  if (internal_notes !== undefined) updates.internal_notes = internal_notes || null;
  if (start_date !== undefined) updates.start_date = start_date || null;
  if (completion_date !== undefined) updates.completion_date = completion_date || null;

  const effectivePricingType = pricing_type ?? co.pricing_type;
  const effectiveFixed = fixed_amount !== undefined ? fixed_amount : co.fixed_amount;

  if (effectivePricingType === "fixed") {
    updates.total_amount = Number(effectiveFixed) || 0;
  }

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

  if (line_items !== undefined && effectivePricingType !== "fixed") {
    await supabase.from("co_line_items").delete().eq("change_order_id", id);

    if (line_items.length > 0) {
      const { error: lineError } = await supabase.from("co_line_items").insert(
        line_items.map((item, i) => ({
          change_order_id: id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          amount: item.quantity * item.rate,
          item_type: item.item_type,
          sort_order: i,
        }))
      );
      if (lineError) {
        return NextResponse.json(
          { error: "Line items failed: " + lineError.message },
          { status: 500 }
        );
      }
    }
  } else if (line_items !== undefined && effectivePricingType === "fixed") {
    await supabase.from("co_line_items").delete().eq("change_order_id", id);
  }

  const admin = createAdminClient();
  await admin.from("audit_log").insert({
    company_id: profile.company_id,
    user_id: user.id,
    action: "edited",
    table_name: "change_orders",
    record_id: id,
    old_data: oldSnapshot,
    new_data: updates,
  });

  return NextResponse.json({ success: true });
}
