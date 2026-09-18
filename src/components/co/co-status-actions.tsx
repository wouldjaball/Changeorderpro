"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Banknote, Archive, Loader2 } from "lucide-react";
import { queryKeys } from "@/lib/query/keys";
import type { COStatus } from "@/types";

interface COStatusActionsProps {
  changeOrderId: string;
  status: COStatus;
}

export function COStatusActions({ changeOrderId, status }: COStatusActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<COStatus | null>(null);

  const canMarkPaid = status === "approved" || status === "invoiced";
  const canArchive = status !== "archived";

  async function setStatus(nextStatus: COStatus) {
    setLoading(nextStatus);
    try {
      const res = await fetch(`/api/co/${changeOrderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update status");
        return;
      }

      toast.success(
        nextStatus === "paid" ? "Marked as paid" : "Change order archived"
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      router.refresh();
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setLoading(null);
    }
  }

  if (!canMarkPaid && !canArchive) return null;

  return (
    <>
      {canMarkPaid && (
        <Button
          variant="outline"
          className="h-12"
          onClick={() => setStatus("paid")}
          disabled={loading !== null}
        >
          {loading === "paid" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Banknote className="mr-2 h-4 w-4" />
          )}
          Mark as Paid
        </Button>
      )}
      {canArchive && (
        <Button
          variant="outline"
          className="h-12 w-12"
          size="icon"
          title="Archive"
          onClick={() => setStatus("archived")}
          disabled={loading !== null}
        >
          {loading === "archived" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Archive className="h-4 w-4" />
          )}
        </Button>
      )}
    </>
  );
}
