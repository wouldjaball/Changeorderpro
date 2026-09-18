export const dynamic = "force-dynamic";

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { parseDashboardFilters } from "@/lib/dashboard/filters";
import {
  getActiveProjects,
  getDashboardChangeOrders,
  getDashboardStats,
} from "@/lib/dashboard/queries";
import { queryKeys } from "@/lib/query/keys";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

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
  const filters = parseDashboardFilters(await searchParams);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user!.id)
    .single();

  const companyId = profile?.company_id as string;

  const [stats, projects, changeOrders] = await Promise.all([
    getDashboardStats(supabase, companyId),
    getActiveProjects(supabase, companyId),
    getDashboardChangeOrders(supabase, companyId, filters),
  ]);

  const queryClient = new QueryClient();
  queryClient.setQueryData(queryKeys.dashboard.stats(companyId), stats);
  queryClient.setQueryData(
    queryKeys.dashboard.list(companyId, filters),
    changeOrders
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button render={<Link href="/change-orders/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            New CO
        </Button>
      </div>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <DashboardClient companyId={companyId} projects={projects} />
      </HydrationBoundary>
    </div>
  );
}
