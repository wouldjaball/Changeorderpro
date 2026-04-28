import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/admin/helpers";
import type { EventRow } from "@/lib/admin/types";

interface ActivityTimelineProps {
  events: EventRow[];
}

function eventDot(type: string): string {
  if (type.includes("approved")) return "bg-green-500";
  if (type.includes("rejected") || type.includes("declined")) return "bg-red-500";
  if (type.includes("sent")) return "bg-blue-500";
  if (type === "signup") return "bg-teal-500";
  return "bg-gray-400";
}

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-start gap-3">
                <div className="mt-1.5">
                  <div className={`w-2 h-2 rounded-full ${eventDot(ev.event_type)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{ev.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
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
