import { Card, CardContent } from "@/components/ui/card";
import { DeltaIndicator } from "@/components/admin/shared/DeltaIndicator";

interface KpiCardProps {
  label: string;
  value: string;
  current: number;
  previous: number;
}

export function KpiCard({ label, value, current, previous }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <div className="mt-2">
          <DeltaIndicator current={current} previous={previous} />
        </div>
      </CardContent>
    </Card>
  );
}
