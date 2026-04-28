import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatRelativeTime, formatAbsoluteDate } from "@/lib/admin/helpers";
import type { CompanyStats } from "@/lib/admin/types";
import { ChannelBadge } from "@/components/admin/shared/ChannelBadge";

interface OverviewPanelProps {
  stats: CompanyStats;
}

export function OverviewPanel({ stats }: OverviewPanelProps) {
  const rows = [
    { label: "Signup Date", value: formatAbsoluteDate(stats.signup_at) },
    { label: "Owner", value: stats.owner_name || "—" },
    { label: "Owner Email", value: stats.owner_email || "—" },
    { label: "Team Size", value: `${stats.team_size} member${stats.team_size !== 1 ? "s" : ""}` },
    { label: "Total COs", value: stats.total_change_orders.toLocaleString() },
    { label: "COs This Month", value: stats.change_orders_this_month.toLocaleString() },
    { label: "Avg CO Value", value: formatCurrency(stats.avg_change_order_value) },
    { label: "Total Revenue", value: formatCurrency(stats.total_change_order_value) },
    { label: "Last Activity", value: formatRelativeTime(stats.last_activity_at) },
    { label: "Last CO", value: formatRelativeTime(stats.last_change_order_at) },
    { label: "Emails (90d)", value: stats.emails_sent_90d.toLocaleString() },
    { label: "SMS (90d)", value: stats.sms_sent_90d.toLocaleString() },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rows.map((row) => (
            <div key={row.label}>
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p className="text-sm font-medium mt-0.5">{row.value}</p>
            </div>
          ))}
          <div>
            <p className="text-xs text-muted-foreground">Channel</p>
            <div className="mt-1">
              <ChannelBadge channel={stats.channel_preference} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
