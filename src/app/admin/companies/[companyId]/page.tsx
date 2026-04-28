import { getCompanyStats } from "@/lib/admin/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PlanBadge } from "@/components/admin/shared/PlanBadge";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { formatAbsoluteDate, daysSinceDate } from "@/lib/admin/helpers";

interface PageProps {
  params: Promise<{ companyId: string }>;
}

export default async function CompanyProfilePage({ params }: PageProps) {
  const { companyId } = await params;
  const stats = await getCompanyStats(companyId);

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

      <div className="p-8 rounded-lg border bg-white text-center text-muted-foreground">
        Full company profile coming in Phase 2.
      </div>
    </div>
  );
}
