"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Awaiting Approval" },
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
  { value: "void", label: "Void" },
  { value: "invoiced", label: "Invoiced" },
];

interface COFiltersProps {
  projects: { id: string; name: string }[];
}

export function COFilters({ projects }: COFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "all";
  const currentProject = searchParams.get("project") || "all";
  const currentSearch = searchParams.get("q") || "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push("/");
  }, [router]);

  const hasFilters = currentStatus !== "all" || currentProject !== "all" || currentSearch !== "";

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search CO # or title..."
          className="pl-9"
          defaultValue={currentSearch}
          onChange={(e) => {
            const value = e.target.value;
            // Debounce search
            const timeout = setTimeout(() => updateParam("q", value), 300);
            return () => clearTimeout(timeout);
          }}
        />
      </div>
      <select
        value={currentStatus}
        onChange={(e) => updateParam("status", e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 text-base"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {projects.length > 0 && (
        <select
          value={currentProject}
          onChange={(e) => updateParam("project", e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-base"
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
          <X className="mr-1 h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
