import {
  getCompanyStats,
  getTeamMembers,
  getCompanyChangeOrders,
  getCompanyEvents,
} from "@/lib/admin/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PlanBadge } from "@/components/admin/shared/PlanBadge";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { formatAbsoluteDate, daysSinceDate } from "@/lib/admin/helpers";
import { OverviewPanel } from "@/components/admin/profile/OverviewPanel";
import { TeamPanel } from "@/components/admin/profile/TeamPanel";
import { ChangeOrdersPanel } from "@/components/admin/profile/ChangeOrdersPanel";
import { ActivityTimeline } from "@/components/admin/profile/ActivityTimeline";

interface PageProps {
  params: Promise<{ companyId: string }>;
}

export default async function CompanyProfilePage({ params }: PageProps) {
  const { companyId } = await params;

  const [stats, team, changeOrders, events] = await Promise.all([
    getCompanyStats(companyId),
    getTeamMembers(companyId),
    getCompanyChangeOrders(companyId),
    getCompanyEvents(companyId, 30),
  ]);

  if (!stats) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/companies"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Back to companies
      </Link>

      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{stats.company_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customer since {formatAbsoluteDate(stats.signup_at)} (
            {daysSinceDate(stats.signup_at)} days)
          </p>
        </div>
        <div className="flex gap-2 ml-auto">
          <PlanBadge plan={stats.plan_name} />
          <StatusBadge status={stats.subscription_status} />
        </div>
      </div>

      <OverviewPanel stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamPanel members={team} />
        <ActivityTimeline events={events} />
      </div>

      <ChangeOrdersPanel
        orders={changeOrders.data}
        total={changeOrders.total}
      />
    </div>
  );
}
