"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryStates } from "nuqs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Clock,
  CheckCircle,
  DollarSign,
  Banknote,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COFilters } from "@/components/co/co-filters";
import {
  EMPTY_DASHBOARD_FILTERS,
  dashboardFiltersToSearchParams,
  hasActiveFilters,
  parseDashboardFilters,
  type DashboardFilters,
} from "@/lib/dashboard/filters";
import type {
  DashboardChangeOrder,
  DashboardProject,
  DashboardStats,
} from "@/lib/dashboard/queries";
import { fetchJson } from "@/lib/query/fetch-json";
import { queryKeys } from "@/lib/query/keys";

interface DashboardClientProps {
  companyId: string;
  projects: DashboardProject[];
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  void: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
  invoiced:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  archived: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const filterParsers = {
  status: parseAsString.withDefault(""),
  project: parseAsString.withDefault(""),
  q: parseAsString.withDefault(""),
  period: parseAsString.withDefault(""),
};

export function DashboardClient({ companyId, projects }: DashboardClientProps) {
  const [rawFilters, setRawFilters] = useQueryStates(filterParsers);
  const [search, setSearch] = useState(rawFilters.q);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filters = useMemo(
    () => parseDashboardFilters(rawFilters),
    [rawFilters]
  );

  const statsQuery = useQuery({
    queryKey: queryKeys.dashboard.stats(companyId),
    queryFn: () => fetchJson<DashboardStats>("/api/dashboard/stats"),
  });

  const listQuery = useQuery({
    queryKey: queryKeys.dashboard.list(companyId, filters),
    queryFn: () =>
      fetchJson<DashboardChangeOrder[]>(
        `/api/dashboard/change-orders?${dashboardFiltersToSearchParams(filters).toString()}`
      ),
    placeholderData: keepPreviousData,
  });

  function clearSearchTimer() {
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
      searchTimer.current = null;
    }
  }

  function updateFilters(next: Partial<DashboardFilters>) {
    clearSearchTimer();
    if (next.q !== undefined) setSearch(next.q);
    const clearsPeriod =
      next.status !== undefined && next.status !== "approved";
    void setRawFilters({ ...next, ...(clearsPeriod ? { period: "" } : {}) });
  }

  function applyStatFilter(next: Partial<DashboardFilters>) {
    updateFilters({ status: "", project: "", q: "", period: "", ...next });
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function statHref(next: Partial<DashboardFilters>) {
    const params = dashboardFiltersToSearchParams(
      parseDashboardFilters({ ...EMPTY_DASHBOARD_FILTERS, ...next })
    ).toString();
    return `/dashboard${params ? `?${params}` : ""}#change-orders`;
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    clearSearchTimer();
    searchTimer.current = setTimeout(() => {
      searchTimer.current = null;
      void setRawFilters({ q: value });
    }, 300);
  }

  const stats = statsQuery.data;
  const hasFilters = hasActiveFilters(filters);
  const changeOrders = listQuery.data;
  const errorMessage =
    statsQuery.error?.message || listQuery.error?.message || null;

  const statCards = [
    {
      label: "Total COs",
      value: stats?.totalCOs ?? 0,
      icon: FileText,
      active: !hasFilters,
      next: {} as Partial<DashboardFilters>,
    },
    {
      label: "Awaiting Approval",
      value: stats?.awaitingApproval ?? 0,
      icon: Clock,
      active: filters.status === "sent" && !filters.period,
      next: { status: "sent" } as Partial<DashboardFilters>,
    },
    {
      label: "Approved This Month",
      value: stats?.approvedThisMonth ?? 0,
      icon: CheckCircle,
      active: filters.status === "approved" && filters.period === "month",
      next: { status: "approved", period: "month" } as Partial<DashboardFilters>,
    },
    {
      label: "Total Approved",
      value: `$${(stats?.totalApprovedValue ?? 0).toLocaleString()}`,
      icon: DollarSign,
      active: filters.status === "approved" && !filters.period,
      next: { status: "approved" } as Partial<DashboardFilters>,
    },
    {
      label: "Total Paid",
      value: `$${(stats?.totalPaidValue ?? 0).toLocaleString()}`,
      sublabel: `${stats?.paidCount ?? 0} change order${stats?.paidCount === 1 ? "" : "s"}`,
      icon: Banknote,
      active: filters.status === "paid" && !filters.period,
      next: { status: "paid" } as Partial<DashboardFilters>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={statHref(stat.next)}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                applyStatFilter(stat.next);
              }}
              aria-label={`Show ${stat.label.toLowerCase()} change orders`}
              className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card
                className={cn(
                  "h-full transition-colors hover:bg-accent/60",
                  stat.active && "ring-2 ring-primary"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {"sublabel" in stat && stat.sublabel && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {stat.sublabel}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Filters */}
      <COFilters
        projects={projects}
        filters={filters}
        search={search}
        onSearchChange={handleSearchChange}
        onFilterChange={updateFilters}
      />

      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}

      {/* COs list */}
      <Card id="change-orders" ref={listRef} className="scroll-mt-20">
        <CardHeader>
          <CardTitle className="text-lg">
            {hasFilters ? "Filtered Change Orders" : "Recent Change Orders"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!changeOrders ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : changeOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              {hasFilters ? (
                <>
                  <p className="font-medium">No matching change orders</p>
                  <p className="text-base mt-1">
                    Try adjusting your filters
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">No change orders yet</p>
                  <p className="text-base mt-1">
                    Create your first change order to get started
                  </p>
                  <Button className="mt-4" render={<Link href="/change-orders/new" />}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Change Order
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "space-y-2 transition-opacity",
                listQuery.isPlaceholderData && "opacity-60"
              )}
            >
              {changeOrders.map((co) => (
                <Link
                  key={co.id}
                  href={`/change-orders/${co.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">
                        {co.co_number}
                      </span>
                      <Badge
                        variant="secondary"
                        className={statusColors[co.status] || ""}
                      >
                        {co.status}
                      </Badge>
                    </div>
                    <p className="font-medium text-base truncate mt-0.5">
                      {co.title}
                    </p>
                    {co.declineNotes && (
                      <p className="text-sm text-muted-foreground truncate">
                        Client: {co.declineNotes}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {co.project ? co.project.name : ""}
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="font-semibold text-base">
                      $
                      {Number(
                        co.total_amount || co.fixed_amount || 0
                      ).toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
