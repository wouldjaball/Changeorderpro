import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const version = "1.0.0";
  const timestamp = new Date().toISOString();

  try {
    const db = createAdminClient();
    const { error } = await db.from("companies").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        { status: "error", version, db: "fail", error: error.message, timestamp },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { status: "ok", version, db: "ok", timestamp },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { status: "error", version, db: "fail", error: "unexpected", timestamp },
      { status: 503 }
    );
  }
}
