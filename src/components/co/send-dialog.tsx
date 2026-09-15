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
import { Loader2, MessageSquare, Mail, Link2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApprovalMethod } from "@/types";

interface SendDialogProps {
  changeOrderId: string;
  coNumber: string;
  coTitle: string;
  clientName?: string;
  clientEmail?: string;
  clientEmails?: string[];
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
    description: "Opens your phone's messenger with the link pre-filled",
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
  clientEmails = [],
  clientPhone,
  children,
}: SendDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sendingMethod, setSendingMethod] = useState<ApprovalMethod | null>(
    null
  );
  const [pendingSms, setPendingSms] = useState<{
    href: string;
    emailAlsoSent: boolean;
  } | null>(null);

  const canSMS = !!clientPhone;
  const allEmails: string[] = [];
  if (clientEmail) allEmails.push(clientEmail);
  for (const e of clientEmails) {
    if (e && !allEmails.includes(e)) allEmails.push(e);
  }
  const canEmail = allEmails.length > 0;

  async function handleSend(method: ApprovalMethod) {
    // Validate we can send via this method
    if ((method === "sms" || method === "both") && !canSMS) {
      toast.error("Client phone number is required for SMS");
      return;
    }
    if ((method === "email" || method === "both") && !canEmail) {
      toast.error("Client email is required for email");
      return;
    }

    setSendingMethod(method);

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
        setSendingMethod(null);
        return;
      }

      // If SMS is part of the method, hand off to the contractor's own phone —
      // copy the message so it can be pasted, and let them open their texting app.
      // A JS-triggered navigation to a custom scheme (sms:) after this async
      // fetch reliably fails on iOS Safari and often on desktop Chrome too, since
      // the browser no longer treats it as tied to the original tap/click — so we
      // surface a real button instead of auto-navigating, giving the user a fresh
      // gesture to trigger the handoff.
      if ((method === "sms" || method === "both") && data.smsBody && data.clientPhone) {
        navigator.clipboard?.writeText(data.smsBody);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const separator = isIOS ? "&" : "?";
        const smsHref = `sms:${data.clientPhone}${separator}body=${encodeURIComponent(data.smsBody)}`;
        toast.success(
          method === "both"
            ? "Email sent. Message copied — tap below to open your texting app."
            : "Message copied — tap below to open your texting app."
        );
        setPendingSms({ href: smsHref, emailAlsoSent: method === "both" });
        router.refresh();
        return;
      } else if (method === "link" && data.approvalUrl) {
        navigator.clipboard?.writeText(data.approvalUrl);
        toast.success("Approval link copied to clipboard");
      } else {
        toast.success(`Change order sent to ${clientName || "client"}!`);
      }

      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSendingMethod(null);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setPendingSms(null);
      setSendingMethod(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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

        {pendingSms ? (
          <>
            <div className="space-y-3 py-2">
              <div className="rounded-lg border p-3 text-base space-y-1">
                {pendingSms.emailAlsoSent && (
                  <p className="text-muted-foreground">
                    Email sent to {clientName || "the client"}.
                  </p>
                )}
                <p>
                  Message copied to your clipboard. Tap below to open your
                  texting app with it pre-filled.
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleOpenChange(false)}
              >
                Done
              </Button>
              <Button
                className="flex-1"
                render={<a href={pendingSms.href} />}
                onClick={() => {
                  setOpen(false);
                  router.refresh();
                }}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Open Messages
              </Button>
            </div>
          </>
        ) : (
          <>
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
                {allEmails.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Email: </span>
                    {allEmails.map((e, i) => (
                      <span key={e}>
                        {i > 0 && ", "}
                        {e}
                      </span>
                    ))}
                  </div>
                )}
                {!clientPhone && !clientEmail && (
                  <p className="text-destructive">
                    No contact info — add client email or phone to the project first
                  </p>
                )}
              </div>

              {/* Method selection — tapping one sends immediately */}
              <div className="space-y-2">
                <Label>Delivery method</Label>
                <div className="grid gap-2">
                  {METHODS.map((m) => {
                    const Icon = m.icon;
                    const disabled =
                      (m.value === "sms" && !canSMS) ||
                      (m.value === "email" && !canEmail) ||
                      (m.value === "both" && (!canSMS || !canEmail)) ||
                      (sendingMethod !== null && sendingMethod !== m.value);
                    const isSending = sendingMethod === m.value;

                    return (
                      <button
                        key={m.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleSend(m.value)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                          isSending
                            ? "border-primary bg-primary/5"
                            : "hover:bg-accent",
                          disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {isSending ? (
                          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                        ) : (
                          <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                        )}
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
                onClick={() => handleOpenChange(false)}
                disabled={sendingMethod !== null}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
