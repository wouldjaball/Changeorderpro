import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/dashboard/queries";

export const dynamic = "force-dynamic";

export async function GET() {
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

  const stats = await getDashboardStats(supabase, profile.company_id);

  return NextResponse.json(stats);
}
