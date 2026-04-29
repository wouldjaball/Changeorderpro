import { KpiCard } from "./KpiCard";
import { formatCurrency } from "@/lib/admin/helpers";
import type { PlatformStats } from "@/lib/admin/types";

interface KpiCardRowProps {
  stats: PlatformStats;
}

export function KpiCardRow({ stats }: KpiCardRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <KpiCard
        label="Total Companies"
        value={stats.total_companies.toLocaleString()}
        current={stats.signups_last_30d + stats.signups_prior_30d}
        previous={stats.signups_prior_30d}
        href="/admin/companies"
      />
      <KpiCard
        label="Active (30d)"
        value={stats.active_companies_30d.toLocaleString()}
        current={stats.active_companies_30d}
        previous={0}
        href="/admin/companies?activity=active_30"
      />
      <KpiCard
        label="Total COs"
        value={stats.total_change_orders.toLocaleString()}
        current={stats.cos_last_30d}
        previous={stats.cos_prior_30d}
      />
      <KpiCard
        label="COs This Month"
        value={stats.change_orders_this_month.toLocaleString()}
        current={stats.cos_last_30d}
        previous={stats.cos_prior_30d}
      />
      <KpiCard
        label="MRR"
        value={formatCurrency(stats.mrr)}
        current={0}
        previous={0}
        href="/admin/companies?sortBy=monthly_amount&sortDir=desc"
      />
    </div>
  );
}
