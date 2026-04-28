import { getPlatformStats } from "@/lib/admin/queries";
import { KpiCardRow } from "@/components/admin/dashboard/KpiCardRow";
import { formatRelativeTime } from "@/lib/admin/helpers";
import { AlertCircle } from "lucide-react";

export default async function AdminDashboard() {
  const stats = await getPlatformStats();

  if (!stats) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
        <AlertCircle size={16} />
        <span>Failed to load platform stats. The materialized view may not exist yet.</span>
      </div>
    );
  }

  const refreshedAt = stats.refreshed_at;
  const isStale =
    new Date().getTime() - new Date(refreshedAt).getTime() > 24 * 60 * 60 * 1000;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Stats refreshed {formatRelativeTime(refreshedAt)}
          {isStale && (
            <span className="ml-2 text-amber-600" title="Stats are more than 24 hours old">
              ⚠
            </span>
          )}
        </p>
      </div>
      <KpiCardRow stats={stats} />
    </div>
  );
}
