"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ApprovalFormProps {
  changeOrderId: string;
  companyId: string;
  token: string;
  coNumber: string;
  amount: number;
}

export function ApprovalForm({
  changeOrderId,
  companyId,
  token,
  coNumber,
  amount,
}: ApprovalFormProps) {
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"approved" | "declined" | null>(null);

  async function handleAction(action: "approved" | "declined") {
    setLoading(true);

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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

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

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="outline"
            className="h-14 text-base border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => handleAction("declined")}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-5 w-5" />
            )}
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
