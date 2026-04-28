"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface CompanyFiltersProps {
  plan?: string;
  status?: string;
  channel?: string;
  activity?: string;
  signupFrom?: string;
  signupTo?: string;
}

export function CompanyFilters({
  plan,
  status,
  channel,
  activity,
  signupFrom,
  signupTo,
}: CompanyFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const update = useCallback(
    (key: string, value: string | null | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.set("page", "1");
      startTransition(() => {
        router.push(`/admin/companies?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition]
  );

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push("/admin/companies");
    });
  }, [router, startTransition]);

  const hasFilters = plan || status || channel || activity || signupFrom || signupTo;

  return (
    <div className={`flex flex-wrap gap-3 items-end ${isPending ? "opacity-60" : ""}`}>
      <div>
        <Label className="text-xs">Plan</Label>
        <Select value={plan || "all"} onValueChange={(v) => update("plan", v)}>
          <SelectTrigger className="w-[130px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Status</Label>
        <Select value={status || "all"} onValueChange={(v) => update("status", v)}>
          <SelectTrigger className="w-[130px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trialing">Trialing</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Channel</Label>
        <Select value={channel || "all"} onValueChange={(v) => update("channel", v)}>
          <SelectTrigger className="w-[130px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="both">Both</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Activity</Label>
        <Select value={activity || "all"} onValueChange={(v) => update("activity", v)}>
          <SelectTrigger className="w-[150px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active_30">Active (30d)</SelectItem>
            <SelectItem value="dormant_14">Dormant (14d+)</SelectItem>
            <SelectItem value="dormant_30">Dormant (30d+)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Signup From</Label>
        <Input
          type="date"
          value={signupFrom || ""}
          onChange={(e) => update("signupFrom", e.target.value || undefined)}
          className="w-[140px] h-8"
        />
      </div>

      <div>
        <Label className="text-xs">Signup To</Label>
        <Input
          type="date"
          value={signupTo || ""}
          onChange={(e) => update("signupTo", e.target.value || undefined)}
          className="w-[140px] h-8"
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1">
          <X size={14} />
          Clear
        </Button>
      )}
    </div>
  );
}
