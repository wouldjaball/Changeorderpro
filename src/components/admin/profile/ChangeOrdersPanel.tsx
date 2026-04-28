import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatAbsoluteDate } from "@/lib/admin/helpers";
import type { ChangeOrderRow } from "@/lib/admin/types";

interface ChangeOrdersPanelProps {
  orders: ChangeOrderRow[];
  total: number;
}

function statusColor(status: string): string {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "sent":
      return "bg-blue-100 text-blue-800";
    case "draft":
      return "bg-gray-100 text-gray-800";
    case "declined":
      return "bg-red-100 text-red-800";
    case "void":
      return "bg-gray-100 text-gray-600";
    case "invoiced":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function ChangeOrdersPanel({ orders, total }: ChangeOrdersPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Change Orders ({total})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No change orders found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-muted-foreground font-medium">CO #</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Customer</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Amount</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Status</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Via</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((co) => (
                <tr key={co.id} className="border-b last:border-0">
                  <td className="py-2 font-mono">{co.co_number}</td>
                  <td className="py-2">{co.customer_name || "—"}</td>
                  <td className="py-2 text-right">{formatCurrency(co.total_amount)}</td>
                  <td className="py-2">
                    <Badge variant="secondary" className={statusColor(co.status)}>
                      {co.status}
                    </Badge>
                  </td>
                  <td className="py-2 text-muted-foreground">{co.sent_via || "—"}</td>
                  <td className="py-2 text-muted-foreground">
                    {formatAbsoluteDate(co.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
