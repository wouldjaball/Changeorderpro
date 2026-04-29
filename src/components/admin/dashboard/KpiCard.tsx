import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { DeltaIndicator } from "@/components/admin/shared/DeltaIndicator";

interface KpiCardProps {
  label: string;
  value: string;
  current: number;
  previous: number;
  href?: string;
}

export function KpiCard({ label, value, current, previous, href }: KpiCardProps) {
  const content = (
    <CardContent className="pt-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <div className="mt-2">
        <DeltaIndicator current={current} previous={previous} />
      </div>
    </CardContent>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        <Card className="transition-colors hover:border-primary/40 hover:bg-muted/30 cursor-pointer">
          {content}
        </Card>
      </Link>
    );
  }

  return <Card>{content}</Card>;
}
