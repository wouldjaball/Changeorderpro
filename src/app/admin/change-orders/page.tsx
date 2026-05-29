export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAllChangeOrders } from "@/lib/admin/queries";
import { formatCurrency, formatAbsoluteDate } from "@/lib/admin/helpers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminChangeOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(typeof params.page === "string" ? params.page : "1", 10);
  const search = typeof params.search === "string" ? params.search : "";

  const result = await getAllChangeOrders(isNaN(page) ? 1 : page, 50, search);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Change Orders ({result.total})</h1>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sr-only">All Change Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {result.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No change orders found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-muted-foreground font-medium">CO #</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Title</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Company</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Customer</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Status</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((co) => (
                  <tr key={co.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-2">
                      <Link
                        href={`/admin/change-orders/${co.id}`}
                        className="font-mono text-blue-600 hover:underline"
                      >
                        {co.co_number}
                      </Link>
                    </td>
                    <td className="py-2">
                      <Link
                        href={`/admin/change-orders/${co.id}`}
                        className="hover:underline"
                      >
                        {co.title}
                      </Link>
                    </td>
                    <td className="py-2">
                      <Link
                        href={`/admin/companies/${co.company_id}`}
                        className="text-muted-foreground hover:underline"
                      >
                        {co.company_name}
                      </Link>
                    </td>
                    <td className="py-2 text-muted-foreground">{co.customer_name || "—"}</td>
                    <td className="py-2 text-right">{formatCurrency(co.total_amount)}</td>
                    <td className="py-2">
                      <Badge variant="secondary" className={statusColor(co.status)}>
                        {co.status}
                      </Badge>
                    </td>
                    <td className="py-2 text-muted-foreground">{formatAbsoluteDate(co.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
