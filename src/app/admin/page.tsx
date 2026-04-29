import {
  getPlatformStats,
  getSignupsTrend,
  getChangeOrdersTrend,
  getRecentEvents,
} from "@/lib/admin/queries";
import { KpiCardRow } from "@/components/admin/dashboard/KpiCardRow";
import { TrendChart } from "@/components/admin/dashboard/TrendChart";
import { ActivityFeed } from "@/components/admin/dashboard/ActivityFeed";
import { RefreshButton } from "@/components/admin/dashboard/RefreshButton";
import { formatRelativeTime } from "@/lib/admin/helpers";
import { AlertCircle } from "lucide-react";

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export default async function AdminDashboard() {
  const [stats, signupsTrend, cosTrend, recentEvents] = await Promise.all([
    getPlatformStats(),
    getSignupsTrend(),
    getChangeOrdersTrend(),
    getRecentEvents(20),
  ]);

  if (!stats) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
        <AlertCircle size={16} />
        <span>
          Failed to load platform stats. The materialized view may not exist yet.
          Run the migrations first.
        </span>
      </div>
    );
  }

  const refreshedAt = stats.refreshed_at;
  const refreshedMs = new Date(refreshedAt).getTime();
  const isStale = new Date().getTime() - refreshedMs > STALE_THRESHOLD_MS;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Stats refreshed {formatRelativeTime(refreshedAt)}
            {isStale && (
              <span
                className="ml-2 text-amber-600"
                title="Stats are more than 24 hours old"
              >
                (stale)
              </span>
            )}
          </p>
          <RefreshButton />
        </div>
      </div>

      <KpiCardRow stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart title="Signups (12 weeks)" data={signupsTrend} />
        <TrendChart
          title="Change Orders (12 weeks)"
          data={cosTrend}
          color="#3B82F6"
        />
      </div>

      <ActivityFeed events={recentEvents} />
    </div>
  );
}
