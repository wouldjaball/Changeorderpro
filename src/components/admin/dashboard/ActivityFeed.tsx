import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/admin/helpers";
import type { EventRow } from "@/lib/admin/types";

interface ActivityFeedProps {
  events: EventRow[];
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-auto">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-start gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p>{ev.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {ev.company_name && (
                      <span className="font-medium text-foreground">
                        {ev.company_name}
                      </span>
                    )}
                    {ev.company_name && " · "}
                    {formatRelativeTime(ev.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
