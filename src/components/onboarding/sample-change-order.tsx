import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPhone } from "@/lib/utils";

interface SampleChangeOrderProps {
  companyName: string;
  logoUrl?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  phone?: string;
  hourlyRate?: string;
}

export function SampleChangeOrder({
  companyName,
  logoUrl,
  addressStreet,
  addressCity,
  addressState,
  addressZip,
  phone,
  hourlyRate,
}: SampleChangeOrderProps) {
  const rate = Number(hourlyRate) > 0 ? Number(hourlyRate) : 85;
  const laborHours = 2;
  const laborAmount = rate * laborHours;
  const materialsAmount = 45;
  const total = laborAmount + materialsAmount;

  const addressLine = [addressCity, addressState, addressZip]
    .filter(Boolean)
    .join(", ");

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={companyName}
                className="h-10 max-w-[160px] object-contain mb-1"
              />
            ) : (
              <p className="font-bold text-lg leading-tight">
                {companyName || "Your Company"}
              </p>
            )}
            {addressStreet && (
              <p className="text-xs text-muted-foreground">{addressStreet}</p>
            )}
            {addressLine && (
              <p className="text-xs text-muted-foreground">{addressLine}</p>
            )}
            {phone && (
              <p className="text-xs text-muted-foreground">{formatPhone(phone)}</p>
            )}
          </div>
          <Badge variant="outline" className="shrink-0">
            Sample
          </Badge>
        </div>
        <Separator className="my-2" />
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            CO-1001
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
            Awaiting Approval
          </Badge>
        </div>
        <CardTitle className="text-base mt-2">
          Add outlet near kitchen island
        </CardTitle>
        <p className="text-sm text-muted-foreground">Project: Smith Kitchen Remodel</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Customer requested one additional 20-amp outlet, including wiring
          and a drywall patch.
        </p>
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              Labor
              <span className="text-xs text-muted-foreground ml-1">
                ({laborHours} hrs @ ${rate.toFixed(2)}/hr)
              </span>
            </span>
            <span>${laborAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Materials</span>
            <span>${materialsAmount.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
