import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCOPdf } from "@/lib/pdf";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Verify authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch change order with project
  const { data: co, error } = await supabase
    .from("change_orders")
    .select("*, project:projects(*)")
    .eq("id", id)
    .single();

  if (error || !co) {
    return NextResponse.json({ error: "Change order not found" }, { status: 404 });
  }

  // Fetch company
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", co.company_id)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  // Fetch line items
  const { data: lineItems } = await supabase
    .from("co_line_items")
    .select("*")
    .eq("change_order_id", id)
    .order("sort_order");

  // Fetch photos
  const { data: photos } = await supabase
    .from("co_photos")
    .select("*")
    .eq("change_order_id", id)
    .order("sort_order");

  // Fetch approval events
  const { data: approvalEvents } = await supabase
    .from("approval_events")
    .select("*")
    .eq("change_order_id", id)
    .order("created_at", { ascending: false });

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
    console.error("PDF generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
