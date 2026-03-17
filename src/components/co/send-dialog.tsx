"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Send, Loader2, MessageSquare, Mail, Link2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApprovalMethod } from "@/types";

interface SendDialogProps {
  changeOrderId: string;
  coNumber: string;
  coTitle: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  children: React.ReactNode;
}

const METHODS: {
  value: ApprovalMethod;
  label: string;
  icon: typeof Mail;
  description: string;
}[] = [
  {
    value: "both",
    label: "SMS + Email",
    icon: Zap,
    description: "Send via both channels for fastest response",
  },
  {
    value: "sms",
    label: "SMS Only",
    icon: MessageSquare,
    description: "Text message with reply-to-approve",
  },
  {
    value: "email",
    label: "Email Only",
    icon: Mail,
    description: "Branded email with approval link",
  },
  {
    value: "link",
    label: "Link Only",
    icon: Link2,
    description: "Generate approval link to share manually",
  },
];

export function SendDialog({
  changeOrderId,
  coNumber,
  coTitle,
  clientName,
  clientEmail,
  clientPhone,
  children,
}: SendDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<ApprovalMethod>("both");
  const [loading, setLoading] = useState(false);

  const canSMS = !!clientPhone;
  const canEmail = !!clientEmail;

  async function handleSend() {
    // Validate we can send via selected method
    if ((method === "sms" || method === "both") && !canSMS) {
      toast.error("Client phone number is required for SMS");
      return;
    }
    if ((method === "email" || method === "both") && !canEmail) {
      toast.error("Client email is required for email");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/co/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changeOrderId,
          method,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to send change order");
        setLoading(false);
        return;
      }

      toast.success(`Change order sent to ${clientName || "client"}!`);

      // If link-only, show the approval link
      if (method === "link" && data.approvalUrl) {
        navigator.clipboard?.writeText(data.approvalUrl);
        toast.info("Approval link copied to clipboard");
      }

      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Change Order</DialogTitle>
          <DialogDescription>
            Send {coNumber} — {coTitle} to{" "}
            {clientName || "the client"} for approval
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Contact info summary */}
          <div className="rounded-lg border p-3 text-base space-y-1">
            {clientName && (
              <p>
                <span className="text-muted-foreground">To: </span>
                <span className="font-medium">{clientName}</span>
              </p>
            )}
            {clientPhone && (
              <p>
                <span className="text-muted-foreground">Phone: </span>
                {clientPhone}
              </p>
            )}
            {clientEmail && (
              <p>
                <span className="text-muted-foreground">Email: </span>
                {clientEmail}
              </p>
            )}
            {!clientPhone && !clientEmail && (
              <p className="text-destructive">
                No contact info — add client email or phone to the project first
              </p>
            )}
          </div>

          {/* Method selection */}
          <div className="space-y-2">
            <Label>Delivery method</Label>
            <div className="grid gap-2">
              {METHODS.map((m) => {
                const Icon = m.icon;
                const disabled =
                  (m.value === "sms" && !canSMS) ||
                  (m.value === "email" && !canEmail) ||
                  (m.value === "both" && (!canSMS || !canEmail));

                return (
                  <button
                    key={m.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => setMethod(m.value)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                      method === m.value
                        ? "border-primary bg-primary/5"
                        : "hover:bg-accent",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        method === m.value
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                    <div>
                      <p className="text-base font-medium">{m.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {m.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSend}
            disabled={loading || (!canSMS && !canEmail && method !== "link")}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
