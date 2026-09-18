import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardChangeOrders } from "@/lib/dashboard/queries";
import { parseDashboardFilters } from "@/lib/dashboard/filters";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

  const filters = parseDashboardFilters(request.nextUrl.searchParams);
  const changeOrders = await getDashboardChangeOrders(
    supabase,
    profile.company_id,
    filters
  );

  return NextResponse.json(changeOrders);
}
