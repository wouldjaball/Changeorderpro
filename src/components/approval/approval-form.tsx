"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { BackLink } from "@/components/approval/back-link";

const MAX_NOTES_LENGTH = 1000;

interface ApprovalFormProps {
  changeOrderId: string;
  companyId: string;
  token: string;
  coNumber: string;
  amount: number;
  companyName?: string;
  backHref?: string | null;
}

export function ApprovalForm({
  changeOrderId,
  companyId,
  token,
  coNumber,
  amount,
  companyName,
  backHref = null,
}: ApprovalFormProps) {
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmingDecline, setConfirmingDecline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"approved" | "declined" | null>(null);
  const [noteSent, setNoteSent] = useState(false);

  const contractorName = companyName || "your contractor";

  async function handleAction(action: "approved" | "declined") {
    setLoading(true);

    const trimmedNotes = notes.trim();

    try {
      const res = await fetch(`/api/co/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          changeOrderId,
          companyId,
          action,
          clientNameTyped: clientName || null,
          notes: trimmedNotes || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setNoteSent(trimmedNotes.length > 0);
      setResult(action);
    } catch {
      toast.error("Network error — please try again");
      setLoading(false);
    }
  }

  if (result) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          {result === "approved" ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Approved!</h2>
              <p className="text-muted-foreground">
                Change Order {coNumber} for $
                {amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}{" "}
                has been approved. A confirmation will be sent to your email.
              </p>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Declined</h2>
              <p className="text-muted-foreground">
                Change Order {coNumber} has been declined. Your project
                manager will follow up with you.
              </p>
            </>
          )}
          {noteSent && (
            <p className="text-muted-foreground mt-2">
              Your note was sent to {contractorName}.
            </p>
          )}
          <div className="mt-6">
            <BackLink href={backHref} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (confirmingDecline) {
    return (
      <Card className="border-red-200">
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2 className="text-lg font-bold">
              Decline Change Order {coNumber}?
            </h2>
            <p className="text-base text-muted-foreground mt-1">
              This is logged and timestamped. {contractorName} will be notified.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="declineNotes">
              Tell {contractorName} why (optional)
            </Label>
            <Textarea
              id="declineNotes"
              autoFocus
              placeholder="Questions, changes you'd like, or why you're declining"
              value={notes}
              maxLength={MAX_NOTES_LENGTH}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-28 text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              className="h-14 text-base"
              onClick={() => setConfirmingDecline(false)}
              disabled={loading}
            >
              Back
            </Button>
            <Button
              className="h-14 text-base bg-red-600 hover:bg-red-700"
              onClick={() => handleAction("declined")}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-5 w-5" />
              )}
              Confirm Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {/* Optional e-signature */}
        <div className="space-y-2">
          <Label htmlFor="clientName">
            Type your name to sign (optional)
          </Label>
          <Input
            id="clientName"
            placeholder="Your full name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="text-lg h-12"
          />
          {clientName && (
            <p
              className="text-2xl text-center py-2"
              style={{ fontFamily: "cursive" }}
            >
              {clientName}
            </p>
          )}
        </div>

        {/* Optional note to the contractor */}
        <div className="space-y-2">
          <Label htmlFor="clientNotes">Add a note (optional)</Label>
          <Textarea
            id="clientNotes"
            placeholder="Questions, changes you'd like, or why you're declining"
            value={notes}
            maxLength={MAX_NOTES_LENGTH}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-24 text-base"
          />
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="outline"
            className="h-14 text-base border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setConfirmingDecline(true)}
            disabled={loading}
          >
            <XCircle className="mr-2 h-5 w-5" />
            Decline
          </Button>
          <Button
            className="h-14 text-base bg-green-600 hover:bg-green-700"
            onClick={() => handleAction("approved")}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-5 w-5" />
            )}
            Approve
          </Button>
        </div>

        <p className="text-sm text-center text-muted-foreground">
          By approving, you authorize the work described above at the stated
          price. This action is logged and timestamped.
        </p>
      </CardContent>
    </Card>
  );
}
