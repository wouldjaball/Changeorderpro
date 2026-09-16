export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  CheckCircle,
  DollarSign,
  Banknote,
  Plus,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { COFilters } from "@/components/co/co-filters";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    project?: string;
    q?: string;
    period?: string;
  }>;
}) {
  const filters = await searchParams;
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user's company_id
  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user!.id)
    .single();

  const companyId = profile?.company_id;

  // Fetch stats
  const { count: totalCOs } = await supabase
    .from("change_orders")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId!);

  const { count: awaitingApproval } = await supabase
    .from("change_orders")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId!)
    .eq("status", "sent");

  const { count: approvedThisMonth } = await supabase
    .from("change_orders")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId!)
    .eq("status", "approved")
    .gte("approved_at", monthStart);

  const { data: approvedCOs } = await supabase
    .from("change_orders")
    .select("total_amount")
    .eq("company_id", companyId!)
    .eq("status", "approved");

  const totalApprovedValue =
    approvedCOs?.reduce(
      (sum, co) => sum + (Number(co.total_amount) || 0),
      0
    ) || 0;

  const { count: paidCount, data: paidCOs } = await supabase
    .from("change_orders")
    .select("total_amount", { count: "exact" })
    .eq("company_id", companyId!)
    .eq("status", "paid")
    .limit(1000);

  const totalPaidValue =
    paidCOs?.reduce((sum, co) => sum + (Number(co.total_amount) || 0), 0) || 0;

  // Fetch projects for filter dropdown
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("company_id", companyId!)
    .eq("status", "active")
    .order("name");

  // Build filtered CO query
  let coQuery = supabase
    .from("change_orders")
    .select("*, project:projects(name)")
    .eq("company_id", companyId!)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (filters.status && filters.status !== "all") {
    coQuery = coQuery.eq("status", filters.status);
  }
  if (filters.period === "month") {
    coQuery = coQuery.gte("approved_at", monthStart);
  }
  if (filters.project && filters.project !== "all") {
    coQuery = coQuery.eq("project_id", filters.project);
  }
  if (filters.q) {
    coQuery = coQuery.or(
      `co_number.ilike.%${filters.q}%,title.ilike.%${filters.q}%`
    );
  }

  const { data: recentCOs } = await coQuery;

  const hasFilters = Boolean(
    filters.status || filters.project || filters.q || filters.period
  );
  const activeStatus = filters.status || "all";
  const activePeriod = filters.period || "";

  const stats = [
    {
      label: "Total COs",
      value: totalCOs || 0,
      icon: FileText,
      href: "/dashboard#change-orders",
      active: hasFilters === false,
    },
    {
      label: "Awaiting Approval",
      value: awaitingApproval || 0,
      icon: Clock,
      href: "/dashboard?status=sent#change-orders",
      active: activeStatus === "sent" && !activePeriod,
    },
    {
      label: "Approved This Month",
      value: approvedThisMonth || 0,
      icon: CheckCircle,
      href: "/dashboard?status=approved&period=month#change-orders",
      active: activeStatus === "approved" && activePeriod === "month",
    },
    {
      label: "Total Approved",
      value: `$${totalApprovedValue.toLocaleString()}`,
      icon: DollarSign,
      href: "/dashboard?status=approved#change-orders",
      active: activeStatus === "approved" && !activePeriod,
    },
    {
      label: "Total Paid",
      value: `$${totalPaidValue.toLocaleString()}`,
      sublabel: `${paidCount || 0} change order${paidCount === 1 ? "" : "s"}`,
      icon: Banknote,
      href: "/dashboard?status=paid#change-orders",
      active: activeStatus === "paid" && !activePeriod,
    },
  ];

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    approved:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    void: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
    invoiced:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
    archived:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button render={<Link href="/change-orders/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            New CO
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
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
      <COFilters projects={projects || []} />

      {/* COs list */}
      <Card id="change-orders" className="scroll-mt-20">
        <CardHeader>
          <CardTitle className="text-lg">
            {hasFilters ? "Filtered Change Orders" : "Recent Change Orders"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!recentCOs || recentCOs.length === 0 ? (
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
            <div className="space-y-2">
              {recentCOs.map((co) => (
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
                    <p className="text-sm text-muted-foreground">
                      {co.project && !Array.isArray(co.project)
                        ? co.project.name
                        : ""}
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
