import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendSMS,
  smsApprovalConfirmation,
  smsDeclineAcknowledgment,
  validateTwilioSignature,
} from "@/lib/twilio";
import { createHmac } from "crypto";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const body = Object.fromEntries(formData.entries()) as Record<string, string>;

  // Validate Twilio signature
  const signature = request.headers.get("x-twilio-signature") || "";
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`;

  if (process.env.TWILIO_AUTH_TOKEN && !validateTwilioSignature(signature, url, body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const from = body.From; // Client's phone number
  const smsBody = (body.Body || "").trim().toUpperCase();
  const messageSid = body.MessageSid;

  if (!from || !smsBody) {
    return new NextResponse("<Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Only process YES or NO replies
  const isApproval = smsBody === "YES" || smsBody === "Y";
  const isDecline = smsBody === "NO" || smsBody === "N";

  if (!isApproval && !isDecline) {
    return new NextResponse("<Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const supabase = createAdminClient();

  // Find the most recent pending CO sent to this phone number
  // Match by client phone on the project
  const { data: matchingCOs } = await supabase
    .from("change_orders")
    .select("*, project:projects(client_name, client_email, client_phone)")
    .eq("status", "sent")
    .order("sent_at", { ascending: false });

  // Find CO where the project's client phone matches the sender
  const normalizedFrom = from.replace(/\D/g, "").slice(-10);
  const co = matchingCOs?.find((c) => {
    const project = c.project && !Array.isArray(c.project) ? c.project : null;
    if (!project?.client_phone) return false;
    const normalizedClient = project.client_phone.replace(/\D/g, "").slice(-10);
    return normalizedClient === normalizedFrom;
  });

  if (!co) {
    return new NextResponse("<Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const project = co.project && !Array.isArray(co.project) ? co.project : null;
  const action = isApproval ? "approved" : "declined";

  // Hash phone number for privacy
  const phoneHash = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY || "")
    .update(from)
    .digest("hex")
    .slice(0, 16);

  // Create approval event
  await supabase.from("approval_events").insert({
    change_order_id: co.id,
    company_id: co.company_id,
    action,
    method: "sms",
    phone_number_hash: phoneHash,
    twilio_message_sid: messageSid,
    metadata: { from_number_last4: from.slice(-4) },
  });

  // Update CO status
  const updateData: Record<string, unknown> = {
    status: action,
  };
  if (isApproval) {
    updateData.approved_at = new Date().toISOString();
  } else {
    updateData.declined_at = new Date().toISOString();
  }
  await supabase.from("change_orders").update(updateData).eq("id", co.id);

  // Get company info for confirmation message
  const { data: company } = await supabase
    .from("companies")
    .select("name, phone")
    .eq("id", co.company_id)
    .single();

  // Send confirmation SMS
  if (isApproval) {
    await sendSMS({
      to: from,
      body: smsApprovalConfirmation({
        coNumber: co.co_number,
        companyName: company?.name || "Your contractor",
        clientEmail: project?.client_email || "your email",
        companyPhone: company?.phone || "",
      }),
    });
  } else {
    await sendSMS({
      to: from,
      body: smsDeclineAcknowledgment({
        coNumber: co.co_number,
        companyName: company?.name || "Your contractor",
        companyPhone: company?.phone || "",
      }),
    });
  }

  // Log the notification
  await supabase.from("notifications_log").insert({
    change_order_id: co.id,
    company_id: co.company_id,
    channel: "sms",
    recipient: from,
    template_type: `${action}_confirmation`,
    external_id: messageSid,
    status: "sent",
  });

  // Return TwiML empty response
  return new NextResponse("<Response></Response>", {
    headers: { "Content-Type": "text/xml" },
  });
}
