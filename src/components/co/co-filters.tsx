"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  hasActiveFilters,
  type DashboardFilters,
} from "@/lib/dashboard/filters";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Awaiting Approval" },
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
  { value: "void", label: "Void" },
  { value: "invoiced", label: "Invoiced" },
  { value: "paid", label: "Paid" },
  { value: "archived", label: "Archived" },
];

interface COFiltersProps {
  projects: { id: string; name: string }[];
  filters: DashboardFilters;
  search: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (next: Partial<DashboardFilters>) => void;
}

export function COFilters({
  projects,
  filters,
  search,
  onSearchChange,
  onFilterChange,
}: COFiltersProps) {
  const currentStatus = filters.status || "all";
  const currentProject = filters.project || "all";
  const hasFilters = hasActiveFilters(filters);

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search CO # or title..."
          className="pl-9"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <select
        value={currentStatus}
        onChange={(e) =>
          onFilterChange({
            status: e.target.value === "all" ? "" : e.target.value,
          })
        }
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
          onChange={(e) =>
            onFilterChange({
              project: e.target.value === "all" ? "" : e.target.value,
            })
          }
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
      {filters.period === "month" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFilterChange({ period: "" })}
          className="h-9"
        >
          This month
          <X className="ml-1 h-3 w-3" />
        </Button>
      )}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onFilterChange({ status: "", project: "", q: "", period: "" })
          }
          className="h-9"
        >
          <X className="mr-1 h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
