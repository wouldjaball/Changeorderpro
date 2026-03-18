import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enhanceDescription, summarizeNotes, suggestLineItems, organizeFromDictation } from "@/lib/ai";

export async function POST(request: NextRequest) {
  // Verify authenticated user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { mode, description, title, projectName, pricingType } = body as {
    mode: "enhance" | "summarize" | "line-items" | "organize";
    description: string;
    title: string;
    projectName?: string;
    pricingType?: string;
  };

  if (!description || !title) {
    return NextResponse.json(
      { error: "Title and description are required" },
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI features are not configured" },
      { status: 503 }
    );
  }

  try {
    if (mode === "enhance") {
      const result = await enhanceDescription({
        description,
        title,
        projectName,
        pricingType,
      });
      return NextResponse.json({ result });
    }

    if (mode === "summarize") {
      const result = await summarizeNotes({ notes: description, title });
      return NextResponse.json({ result });
    }

    if (mode === "line-items") {
      const items = await suggestLineItems({
        description,
        title,
        pricingType: pricingType || "tm",
      });
      return NextResponse.json({ items });
    }

    if (mode === "organize") {
      const organized = await organizeFromDictation({
        description,
        title,
        projectName,
        pricingType,
      });
      return NextResponse.json({
        result: organized.description,
        items: organized.line_items,
      });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (err) {
    console.error("AI API error:", err);
    return NextResponse.json(
      { error: "AI service unavailable" },
      { status: 500 }
    );
  }
}
