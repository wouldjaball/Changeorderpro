import { NextResponse } from "next/server";
import { sendEmail, emailWelcome, emailNewSignupNotification } from "@/lib/resend";

const ADMIN_EMAIL = "aaron@salesmonsters.com";

export async function POST(request: Request) {
  try {
    const { name, email, phone } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: "name and email required" }, { status: 400 });
    }

    const results = await Promise.allSettled([
      sendEmail({
        to: email,
        ...emailWelcome({ name }),
        replyTo: ADMIN_EMAIL,
      }),
      sendEmail({
        to: ADMIN_EMAIL,
        ...emailNewSignupNotification({ name, email, phone: phone || null }),
      }),
    ]);

    const welcomeResult = results[0];
    const notifyResult = results[1];

    return NextResponse.json({
      welcome: welcomeResult.status === "fulfilled" ? "sent" : "failed",
      notify: notifyResult.status === "fulfilled" ? "sent" : "failed",
    });
  } catch (err) {
    console.error("[signup-webhook]", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
