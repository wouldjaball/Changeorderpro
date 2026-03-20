export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Bell,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { SendDialog } from "@/components/co/send-dialog";
import { PdfDownloadButton } from "@/components/co/pdf-download-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Change Order Detail",
};

const statusConfig: Record<
  string,
  { color: string; icon: typeof Clock; label: string }
> = {
  draft: { color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", icon: Clock, label: "Draft" },
  sent: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", icon: Send, label: "Awaiting Approval" },
  approved: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", icon: CheckCircle, label: "Approved" },
  declined: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", icon: XCircle, label: "Declined" },
  void: { color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500", icon: XCircle, label: "Void" },
  invoiced: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300", icon: CheckCircle, label: "Invoiced" },
};

export default async function ChangeOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: co, error } = await supabase
    .from("change_orders")
    .select("*, project:projects(*)")
    .eq("id", id)
    .single();

  if (error || !co) notFound();

  const { data: lineItems } = await supabase
    .from("co_line_items")
    .select("*")
    .eq("change_order_id", id)
    .order("sort_order");

  const { data: photos } = await supabase
    .from("co_photos")
    .select("*")
    .eq("change_order_id", id)
    .order("sort_order");

  const { data: approvalEvents } = await supabase
    .from("approval_events")
    .select("*")
    .eq("change_order_id", id)
    .order("created_at", { ascending: false });

  const project = co.project && !Array.isArray(co.project) ? co.project : null;
  const status = statusConfig[co.status] || statusConfig.draft;
  const StatusIcon = status.icon;

  const eventIcons: Record<string, typeof CheckCircle> = {
    approved: CheckCircle,
    declined: XCircle,
    viewed: Eye,
    reminder_sent: Bell,
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" render={<Link href="/" />}>
            <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base text-muted-foreground">
              {co.co_number}
            </span>
            <Badge variant="secondary" className={status.color}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {status.label}
            </Badge>
          </div>
          <h1 className="text-xl font-bold mt-0.5">{co.title}</h1>
        </div>
      </div>

      {/* Project info */}
      {project && (
        <Card>
          <CardContent className="p-3 text-base">
            <span className="text-muted-foreground">Project: </span>
            <Link
              href={`/projects/${project.id}`}
              className="font-medium hover:underline"
            >
              {project.name}
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {co.description && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base whitespace-pre-wrap">{co.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Pricing */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge variant="outline" className="text-sm">
            {co.pricing_type === "fixed"
              ? "Fixed Price"
              : co.pricing_type === "tm"
                ? "Time & Materials"
                : "Hybrid"}
          </Badge>

          {co.fixed_amount && co.pricing_type !== "tm" && (
            <div className="flex justify-between text-base">
              <span>Fixed amount</span>
              <span className="font-medium">
                ${Number(co.fixed_amount).toLocaleString()}
              </span>
            </div>
          )}

          {lineItems && lineItems.length > 0 && (
            <div className="space-y-2">
              {lineItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-base border-b pb-2 last:border-0"
                >
                  <div>
                    <p>{item.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} {item.unit} @ ${Number(item.rate).toFixed(2)}
                    </p>
                  </div>
                  <span className="font-medium">
                    ${Number(item.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span className="text-lg">
              $
              {Number(
                co.total_amount || co.fixed_amount || 0
              ).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      {photos && photos.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Photos ({photos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-lg overflow-hidden border"
                >
                  <Image
                    src={photo.annotated_url || photo.original_url}
                    alt={photo.file_name || "CO Photo"}
                    width={200}
                    height={200}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Internal notes */}
      {co.internal_notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-muted-foreground">
              Internal Notes (not visible to client)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base">{co.internal_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Approval timeline */}
      {approvalEvents && approvalEvents.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Approval History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvalEvents.map((event) => {
                const EventIcon = eventIcons[event.action] || Clock;
                return (
                  <div key={event.id} className="flex items-start gap-3">
                    <EventIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="text-base">
                      <p className="font-medium capitalize">{event.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()} via{" "}
                        {event.method}
                      </p>
                      {event.client_name_typed && (
                        <p className="text-sm">
                          Signed: {event.client_name_typed}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2 pb-4">
        {(co.status === "draft" || co.status === "declined") && (
          <SendDialog
            changeOrderId={co.id}
            coNumber={co.co_number}
            coTitle={co.title}
            clientName={project?.client_name || undefined}
            clientEmail={project?.client_email || undefined}
            clientPhone={project?.client_phone || undefined}
            smsConsent={project?.sms_consent || false}
          >
            <Button className="flex-1 h-12">
              <Send className="mr-2 h-4 w-4" />
              Send to Client
            </Button>
          </SendDialog>
        )}
        {co.status === "sent" && (
          <SendDialog
            changeOrderId={co.id}
            coNumber={co.co_number}
            coTitle={co.title}
            clientName={project?.client_name || undefined}
            clientEmail={project?.client_email || undefined}
            clientPhone={project?.client_phone || undefined}
            smsConsent={project?.sms_consent || false}
          >
            <Button variant="outline" className="flex-1 h-12">
              <Send className="mr-2 h-4 w-4" />
              Resend for Approval
            </Button>
          </SendDialog>
        )}
        {co.status === "approved" && (
          <Badge className="flex-1 h-12 justify-center text-base bg-green-100 text-green-800">
            <CheckCircle className="mr-2 h-4 w-4" />
            Approved
          </Badge>
        )}
        <PdfDownloadButton
          changeOrderId={co.id}
          coNumber={co.co_number}
          className="h-12 w-12"
        />
      </div>
    </div>
  );
}
