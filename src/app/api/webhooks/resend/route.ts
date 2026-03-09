import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Resend webhook event types
type ResendEvent = {
  type: "email.sent" | "email.delivered" | "email.bounced" | "email.opened" | "email.clicked" | "email.complained";
  data: {
    email_id: string;
    to: string[];
    subject: string;
    created_at: string;
  };
};

const STATUS_MAP: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.opened": "opened",
  "email.clicked": "clicked",
};

export async function POST(request: NextRequest) {
  const event = (await request.json()) as ResendEvent;

  const status = STATUS_MAP[event.type];
  if (!status) {
    return NextResponse.json({ received: true });
  }

  const supabase = createAdminClient();

  // Update notification log entry by external_id
  const { error } = await supabase
    .from("notifications_log")
    .update({ status })
    .eq("external_id", event.data.email_id);

  if (error) {
    console.error("Failed to update notification log:", error);
  }

  return NextResponse.json({ received: true });
}
