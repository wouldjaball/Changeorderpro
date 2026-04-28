import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin/login?error=auth_failed", request.url)
    );
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL("/admin/login?error=auth_failed", request.url)
      );
    }

    return NextResponse.redirect(new URL("/admin", request.url));
  } catch {
    return NextResponse.redirect(
      new URL("/admin/login?error=auth_failed", request.url)
    );
  }
}