export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getChangeOrderDetail } from "@/lib/admin/queries";
import { formatCurrency, formatAbsoluteDate } from "@/lib/admin/helpers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPdfButton } from "./admin-pdf-button";

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

function actionLabel(action: string): string {
  switch (action) {
    case "approved":
      return "Approved";
    case "declined":
      return "Declined";
    case "viewed":
      return "Viewed";
    case "reminder_sent":
      return "Reminder sent";
    default:
      return action;
  }
}

interface PageProps {
  params: Promise<{ coId: string }>;
}

export default async function AdminChangeOrderDetailPage({ params }: PageProps) {
  const { coId } = await params;
  const co = await getChangeOrderDetail(coId);

  if (!co) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/companies/${co.company_id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Back to {co.company_name}
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            #{co.co_number} — {co.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {co.company_name} &middot; {co.project_name}
            {co.created_by_name && <> &middot; Created by {co.created_by_name}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AdminPdfButton coId={co.id} coNumber={co.co_number} />
          <Badge variant="secondary" className={`text-sm ${statusColor(co.status)}`}>
            {co.status}
          </Badge>
        </div>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Pricing</p>
              <p className="font-medium capitalize">{co.pricing_type === "tm" ? "Time & Materials" : co.pricing_type}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-bold text-lg">{formatCurrency(co.total_amount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Approval Method</p>
              <p className="font-medium capitalize">{co.approval_method || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Client</p>
              <p className="font-medium">{co.client_name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Client Email</p>
              <p className="font-medium">{co.client_email ? <a href={`mailto:${co.client_email}`} className="text-blue-600 hover:underline">{co.client_email}</a> : "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Client Phone</p>
              <p className="font-medium">{co.client_phone || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">{formatAbsoluteDate(co.created_at)}</p>
            </div>
            {co.sent_at && (
              <div>
                <p className="text-muted-foreground">Sent</p>
                <p className="font-medium">{formatAbsoluteDate(co.sent_at)}</p>
              </div>
            )}
            {co.approved_at && (
              <div>
                <p className="text-muted-foreground">Approved</p>
                <p className="font-medium">{formatAbsoluteDate(co.approved_at)}</p>
              </div>
            )}
            {co.declined_at && (
              <div>
                <p className="text-muted-foreground">Declined</p>
                <p className="font-medium">{formatAbsoluteDate(co.declined_at)}</p>
              </div>
            )}
            {co.edit_count > 0 && (
              <div>
                <p className="text-muted-foreground">Edits</p>
                <p className="font-medium">{co.edit_count}</p>
              </div>
            )}
          </div>

          {co.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-muted-foreground text-sm mb-1">Description</p>
              <p className="text-sm whitespace-pre-wrap">{co.description}</p>
            </div>
          )}

          {co.internal_notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-muted-foreground text-sm mb-1">Internal Notes</p>
              <p className="text-sm whitespace-pre-wrap text-amber-700">{co.internal_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Items */}
      {co.line_items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Line Items ({co.line_items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-muted-foreground font-medium">Description</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Type</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Qty</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Unit</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Rate</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {co.line_items.map((li) => (
                  <tr key={li.id} className="border-b last:border-0">
                    <td className="py-2">{li.description}</td>
                    <td className="py-2 capitalize text-muted-foreground">{li.item_type}</td>
                    <td className="py-2 text-right">{li.quantity}</td>
                    <td className="py-2 text-muted-foreground">{li.unit}</td>
                    <td className="py-2 text-right">{formatCurrency(li.rate)}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(li.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2">
                  <td colSpan={5} className="py-2 text-right font-bold">Total</td>
                  <td className="py-2 text-right font-bold">{formatCurrency(co.total_amount)}</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Photos */}
      {co.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Photos ({co.photos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {co.photos.map((photo) => (
                <a
                  key={photo.id}
                  href={photo.annotated_url || photo.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.annotated_url || photo.original_url}
                    alt={photo.file_name || "CO Photo"}
                    className="w-full h-32 object-cover rounded-lg border hover:opacity-90 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Timeline */}
      {co.approval_events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Approval Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {co.approval_events.map((evt) => (
                <div key={evt.id} className="flex items-start gap-3 text-sm">
                  <Badge variant="outline" className="capitalize shrink-0">
                    {actionLabel(evt.action)}
                  </Badge>
                  <div className="flex-1">
                    {evt.client_name_typed && (
                      <span className="font-medium">Signed by: {evt.client_name_typed}</span>
                    )}
                    {evt.method && (
                      <span className="text-muted-foreground ml-2">via {evt.method}</span>
                    )}
                  </div>
                  <span className="text-muted-foreground shrink-0">
                    {formatAbsoluteDate(evt.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
