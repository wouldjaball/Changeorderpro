import { createAdminClient } from "@/lib/supabase/admin";
import { isTokenValid } from "@/lib/tokens";
import { ApprovalForm } from "@/components/approval/approval-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Approve Change Order",
};

export default async function ApprovalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  // Find CO by approval token
  const { data: co, error } = await supabase
    .from("change_orders")
    .select("*, project:projects(name, client_name)")
    .eq("approval_token", token)
    .single();

  if (error || !co) {
    return (
      <ErrorPage
        icon={<AlertTriangle className="h-12 w-12 text-destructive" />}
        title="Invalid Link"
        message="This approval link is not valid. It may have been used already or the change order may no longer exist."
      />
    );
  }

  // Validate token
  const validation = isTokenValid(
    token,
    co.approval_token_expires_at,
    co.status
  );

  if (!validation.valid) {
    const isAlreadyActioned = co.status === "approved" || co.status === "declined";
    return (
      <ErrorPage
        icon={
          isAlreadyActioned ? (
            co.status === "approved" ? (
              <CheckCircle className="h-12 w-12 text-green-500" />
            ) : (
              <XCircle className="h-12 w-12 text-red-500" />
            )
          ) : (
            <AlertTriangle className="h-12 w-12 text-destructive" />
          )
        }
        title={
          isAlreadyActioned
            ? `Change Order ${co.status === "approved" ? "Approved" : "Declined"}`
            : "Link Expired"
        }
        message={validation.reason || "This link is no longer valid."}
      />
    );
  }

  // Record view event
  await supabase.from("approval_events").insert({
    change_order_id: co.id,
    company_id: co.company_id,
    action: "viewed",
    method: "link",
  });

  // Get company branding
  const { data: company } = await supabase
    .from("companies")
    .select("name, logo_url, phone, settings")
    .eq("id", co.company_id)
    .single();

  // Get line items
  const { data: lineItems } = await supabase
    .from("co_line_items")
    .select("*")
    .eq("change_order_id", co.id)
    .order("sort_order");

  // Get photos
  const { data: photos } = await supabase
    .from("co_photos")
    .select("*")
    .eq("change_order_id", co.id)
    .order("sort_order");

  const project = co.project && !Array.isArray(co.project) ? co.project : null;
  const amount = Number(co.total_amount || co.fixed_amount || 0);
  const termsText = company?.settings?.terms_text;

  return (
    <div className="min-h-svh bg-muted/40 py-6 px-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Company header */}
        <div className="text-center">
          {company?.logo_url ? (
            <Image
              src={company.logo_url}
              alt={company.name}
              width={160}
              height={60}
              className="mx-auto mb-2"
            />
          ) : (
            <h1 className="text-xl font-bold">{company?.name}</h1>
          )}
        </div>

        {/* CO details card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-sm">
                {co.co_number}
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Awaiting Your Approval
              </Badge>
            </div>
            <CardTitle className="text-lg mt-2">{co.title}</CardTitle>
            {project?.name && (
              <p className="text-base text-muted-foreground">
                Project: {project.name}
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Description */}
            {co.description && (
              <div>
                <p className="text-base font-medium mb-1">Description</p>
                <p className="text-base text-muted-foreground whitespace-pre-wrap">
                  {co.description}
                </p>
              </div>
            )}

            {/* Pricing */}
            <div>
              <p className="text-base font-medium mb-2">Pricing</p>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                {co.fixed_amount && co.pricing_type !== "tm" && (
                  <div className="flex justify-between text-base">
                    <span>Fixed amount</span>
                    <span>${Number(co.fixed_amount).toLocaleString()}</span>
                  </div>
                )}
                {lineItems && lineItems.length > 0 && (
                  <>
                    {lineItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-base">
                        <div>
                          <span>{item.description}</span>
                          <span className="text-sm text-muted-foreground ml-1">
                            ({item.quantity} {item.unit} @ ${Number(item.rate).toFixed(2)})
                          </span>
                        </div>
                        <span>${Number(item.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>
                    ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {co.pricing_type === "tm" && (
                  <p className="text-sm text-muted-foreground">
                    * Estimate based on projected hours. Final invoice will reflect actual time and materials.
                  </p>
                )}
              </div>
            </div>

            {/* Photos */}
            {photos && photos.length > 0 && (
              <div>
                <p className="text-base font-medium mb-2">Photos</p>
                <div className="grid grid-cols-2 gap-2">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-square rounded-lg overflow-hidden border"
                    >
                      <Image
                        src={photo.annotated_url || photo.original_url}
                        alt="Change order photo"
                        width={300}
                        height={300}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terms */}
            {termsText && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Terms & Conditions
                </p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {termsText}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval form (client component) */}
        <ApprovalForm
          changeOrderId={co.id}
          companyId={co.company_id}
          token={token}
          coNumber={co.co_number}
          amount={amount}
        />

        <div className="text-sm text-center text-muted-foreground space-y-1">
          <p>Powered by ChangeOrder Pro</p>
          <p>
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            {" · "}
            <Link href="/terms" className="hover:underline">
              Terms &amp; Conditions
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorPage({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2">{icon}</div>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}
