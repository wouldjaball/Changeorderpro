import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user is admin
  const { data: profile } = await supabase
    .from("users")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  const { email, role } = body as { email: string; role: string };

  if (!email || !role) {
    return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
  }

  // Get company info
  const admin = createAdminClient();
  const { data: company } = await admin
    .from("companies")
    .select("name")
    .eq("id", profile.company_id!)
    .single();

  // Send invite email with signup link
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const signupLink = `${appUrl}/signup?invite=${encodeURIComponent(profile.company_id!)}&role=${encodeURIComponent(role)}`;

  try {
    await sendEmail({
      to: email,
      subject: `You're invited to join ${company?.name || "a team"} on ChangeOrder Pro`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited!</h2>
          <p>${company?.name || "A team"} has invited you to join their team on ChangeOrder Pro as a <strong>${role}</strong>.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${signupLink}" style="background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Accept Invitation</a>
          </div>
          <p style="color: #666; font-size: 14px;">ChangeOrder Pro helps construction teams manage change orders digitally.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[team/invite] send failed", { recipient: email, error: message });
    return NextResponse.json(
      { error: `Failed to send invite email: ${message}` },
      { status: 500 }
    );
  }
}
