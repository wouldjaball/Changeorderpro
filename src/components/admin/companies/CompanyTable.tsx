"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { PlanBadge } from "@/components/admin/shared/PlanBadge";
import { ChannelBadge } from "@/components/admin/shared/ChannelBadge";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { formatRelativeTime, formatAbsoluteDate } from "@/lib/admin/helpers";
import { Search, ChevronUp, ChevronDown, Building2 } from "lucide-react";
import type { CompanyStats } from "@/lib/admin/types";

interface CompanyTableProps {
  data: CompanyStats[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  sortBy: string;
  sortDir: "asc" | "desc";
}

export function CompanyTable({
  data,
  total,
  page,
  pageSize,
  search,
  sortBy,
  sortDir,
}: CompanyTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(search);
  const totalPages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      startTransition(() => {
        router.push(`/admin/companies?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition]
  );

  const handleSearch = useCallback(() => {
    updateParams({ search: searchValue || undefined, page: "1" });
  }, [searchValue, updateParams]);

  const handleSort = useCallback(
    (column: string) => {
      const newDir = sortBy === column && sortDir === "desc" ? "asc" : "desc";
      updateParams({ sortBy: column, sortDir: newDir, page: "1" });
    },
    [sortBy, sortDir, updateParams]
  );

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null;
    return sortDir === "asc" ? (
      <ChevronUp size={14} />
    ) : (
      <ChevronDown size={14} />
    );
  };

  const columns = [
    { key: "company_name", label: "Company" },
    { key: "owner_name", label: "Owner" },
    { key: "owner_email", label: "Email" },
    { key: "plan_name", label: "Plan" },
    { key: "subscription_status", label: "Status" },
    { key: "total_change_orders", label: "# COs" },
    { key: "last_activity_at", label: "Last Active" },
    { key: "channel_preference", label: "Channel" },
    { key: "signup_at", label: "Signup" },
  ];

  return (
    <div className={`space-y-4 ${isPending ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            placeholder="Search company, owner, email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={<Building2 size={40} className="text-muted-foreground" />}
          title="No companies found"
          description={
            search
              ? "No companies match your search. Try a different query."
              : "No companies on the platform yet."
          }
        />
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            Showing {from}–{to} of {total}
          </div>
          <div className="rounded-lg border bg-white overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        <SortIcon column={col.key} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr
                    key={row.company_id}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/companies/${row.company_id}`}
                        className="text-teal-700 font-medium hover:underline"
                      >
                        {row.company_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{row.owner_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.owner_email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <PlanBadge plan={row.plan_name} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.subscription_status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.total_change_orders}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span title={formatAbsoluteDate(row.last_activity_at)}>
                        {formatRelativeTime(row.last_activity_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ChannelBadge channel={row.channel_preference} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatAbsoluteDate(row.signup_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() =>
                  updateParams({ page: String(page - 1) })
                }
              >
                Prev
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateParams({ page: String(p) })}
                  >
                    {p}
                  </Button>
                );
              })}
              {totalPages > 5 && (
                <span className="text-muted-foreground">...</span>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() =>
                  updateParams({ page: String(page + 1) })
                }
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
