"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { refreshStats } from "@/app/admin/actions";

export function RefreshButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      disabled={isPending}
      onClick={() => startTransition(() => refreshStats())}
    >
      <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
      {isPending ? "Refreshing…" : "Refresh"}
    </Button>
  );
}
