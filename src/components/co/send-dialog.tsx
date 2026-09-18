"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2,
  MessageSquare,
  Mail,
  Link2,
  Zap,
  Send,
  Phone,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { ApprovalMethod } from "@/types";

interface SendDialogProps {
  changeOrderId: string;
  projectId?: string;
  coNumber: string;
  coTitle: string;
  clientName?: string;
  clientEmail?: string;
  clientEmails?: string[];
  clientPhone?: string;
  triggerLabel: string;
  triggerVariant?: VariantProps<typeof buttonVariants>["variant"];
  triggerClassName?: string;
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
    description: "Sends the email now and opens your texting app",
  },
  {
    value: "sms",
    label: "SMS Only",
    icon: MessageSquare,
    description: "One tap opens your texting app with the message ready to send",
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

function normalizePhoneForSms(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^\d]/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

function buildSmsHref(phone: string, body: string): string {
  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isIOS ? "&" : "?";
  return `sms:${normalizePhoneForSms(phone)}${separator}body=${encodeURIComponent(body)}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function SendDialog({
  changeOrderId,
  projectId,
  coNumber,
  coTitle,
  clientName,
  clientEmail,
  clientEmails = [],
  clientPhone,
  triggerLabel,
  triggerVariant = "default",
  triggerClassName,
}: SendDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sendingMethod, setSendingMethod] = useState<ApprovalMethod | null>(
    null
  );
  const [prepared, setPrepared] = useState<{
    approvalUrl: string;
    smsBody: string;
  } | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const needsRefresh = useRef(false);
  const [phone, setPhone] = useState(clientPhone || "");
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  const canSMS = !!phone;
  const canEditPhone = !!projectId;
  const allEmails: string[] = [];
  if (clientEmail) allEmails.push(clientEmail);
  for (const e of clientEmails) {
    if (e && !allEmails.includes(e)) allEmails.push(e);
  }
  const canEmail = allEmails.length > 0;

  useEffect(() => {
    if (!open) {
      setPrepared(null);
      setPrepareError(null);
      setPreparing(false);
      return;
    }

    let cancelled = false;
    setPreparing(true);
    setPrepareError(null);

    (async () => {
      try {
        const res = await fetch(`/api/co/${changeOrderId}/prepare-send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          setPrepareError(data.error || "Could not prepare the approval link");
          return;
        }

        setPrepared({ approvalUrl: data.approvalUrl, smsBody: data.smsBody });
      } catch {
        if (!cancelled) {
          setPrepareError("Network error — close and reopen to try again");
        }
      } finally {
        if (!cancelled) setPreparing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, changeOrderId]);

  const smsHref =
    prepared && phone ? buildSmsHref(phone, prepared.smsBody) : null;

  async function handleSavePhone(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    const trimmed = phoneDraft.trim();
    const digits = trimmed.replace(/[^\d]/g, "");
    if (digits.length < 10) {
      toast.error("Enter a valid cell phone number");
      return;
    }

    setSavingPhone(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("projects")
      .update({ client_phone: trimmed })
      .eq("id", projectId);

    if (error) {
      toast.error("Failed to save phone number");
      setSavingPhone(false);
      return;
    }

    setPhone(trimmed);
    setEditingPhone(false);
    setPhoneDraft("");
    setSavingPhone(false);
    needsRefresh.current = true;
    toast.success("Cell phone saved to project");
  }

  async function commitSend(method: ApprovalMethod) {
    setSendingMethod(method);

    try {
      const res = await fetch("/api/co/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeOrderId, method }),
        keepalive: true,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to send change order");
        setSendingMethod(null);
        return;
      }

      toast.success(
        method === "both"
          ? "Email sent. Text is ready in Messages"
          : "Text is ready in Messages"
      );
      needsRefresh.current = true;
      handleOpenChange(false);
    } catch {
      toast.error("Network error — please try again");
      setSendingMethod(null);
    }
  }

  async function handleSend(method: ApprovalMethod) {
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

      if (method === "link" && data.approvalUrl) {
        const copied = await copyToClipboard(data.approvalUrl);
        toast.success(
          copied
            ? "Approval link copied to clipboard"
            : "Approval link generated"
        );
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
      setSendingMethod(null);
      if (needsRefresh.current) {
        needsRefresh.current = false;
        router.refresh();
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant={triggerVariant} className={triggerClassName} />
        }
      >
        <Send className="mr-2 h-4 w-4" />
        {triggerLabel}
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
            {editingPhone ? (
              <form
                onSubmit={handleSavePhone}
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Client cell phone"
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  className="h-9 text-base"
                  autoFocus
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 px-3"
                  disabled={savingPhone}
                >
                  {savingPhone ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-9 px-2"
                  onClick={() => {
                    setEditingPhone(false);
                    setPhoneDraft("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : phone ? (
              <p className="flex items-center gap-2">
                <span className="text-muted-foreground">Phone: </span>
                <a href={`tel:${phone}`} className="hover:underline">
                  {phone}
                </a>
                {canEditPhone && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneDraft(phone);
                      setEditingPhone(true);
                    }}
                    className="ml-auto text-sm text-muted-foreground hover:text-foreground"
                  >
                    Change
                  </button>
                )}
              </p>
            ) : canEditPhone ? (
              <button
                type="button"
                onClick={() => setEditingPhone(true)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-4 w-4" />
                Add client cell phone for SMS
              </button>
            ) : null}
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
            {!phone && !canEmail && (
              <p className="text-destructive">
                No contact info — add a client cell phone above or an email
                on the project
              </p>
            )}
          </div>

          {/* Method selection — tapping one sends immediately */}
          <div className="space-y-2">
            <Label>Delivery method</Label>
            {prepareError && (
              <p className="text-sm text-destructive">{prepareError}</p>
            )}
            <div className="grid gap-2">
              {METHODS.map((m) => {
                const Icon = m.icon;
                const isSmsMethod = m.value === "sms" || m.value === "both";
                const isSending = sendingMethod === m.value;
                const tileClassName = (disabled: boolean) =>
                  cn(
                    "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                    isSending
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent",
                    disabled && "opacity-50 cursor-not-allowed"
                  );
                const showSpinner =
                  isSending || (isSmsMethod && preparing && !isSending);
                const body = (
                  <>
                    {showSpinner ? (
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
                  </>
                );

                if (isSmsMethod) {
                  const enabled =
                    canSMS &&
                    !!smsHref &&
                    sendingMethod === null &&
                    (m.value === "both" ? canEmail : true);

                  if (enabled) {
                    return (
                      <a
                        key={m.value}
                        href={smsHref}
                        onClick={() => commitSend(m.value)}
                        className={tileClassName(false)}
                      >
                        {body}
                      </a>
                    );
                  }

                  return (
                    <button
                      key={m.value}
                      type="button"
                      disabled
                      className={tileClassName(true)}
                    >
                      {body}
                    </button>
                  );
                }

                const disabled =
                  (m.value === "email" && !canEmail) ||
                  (sendingMethod !== null && sendingMethod !== m.value);

                return (
                  <button
                    key={m.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSend(m.value)}
                    className={tileClassName(disabled)}
                  >
                    {body}
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
      </DialogContent>
    </Dialog>
  );
}
