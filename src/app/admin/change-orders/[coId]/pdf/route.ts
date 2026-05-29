import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin/auth";
import { generateCOPdf } from "@/lib/pdf";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ coId: string }> }
) {
  const { coId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();

  const { data: co, error } = await db
    .from("change_orders")
    .select("*, project:projects(*)")
    .eq("id", coId)
    .single();

  if (error || !co) {
    return NextResponse.json({ error: "Change order not found" }, { status: 404 });
  }

  const { data: company } = await db
    .from("companies")
    .select("*")
    .eq("id", co.company_id)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const { data: lineItems } = await db
    .from("co_line_items")
    .select("*")
    .eq("change_order_id", coId)
    .order("sort_order")
    .limit(200);

  const { data: photos } = await db
    .from("co_photos")
    .select("*")
    .eq("change_order_id", coId)
    .order("sort_order")
    .limit(50);

  const { data: approvalEvents } = await db
    .from("approval_events")
    .select("*")
    .eq("change_order_id", coId)
    .order("created_at", { ascending: false })
    .limit(100);

  const project = co.project && !Array.isArray(co.project) ? co.project : null;
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    const pdfBuffer = await generateCOPdf({
      company,
      project,
      changeOrder: co,
      lineItems: lineItems || [],
      photos: photos || [],
      approvalEvents: approvalEvents || [],
    });

    const filename = `${co.co_number.replace(/\s+/g, "_")}_${co.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30)}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Admin PDF generation error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
