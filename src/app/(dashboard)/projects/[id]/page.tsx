export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, MapPin, Phone, Mail, User } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { CsvExportButton } from "@/components/co/csv-export-button";

export const metadata: Metadata = {
  title: "Project Details",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  const { data: changeOrders } = await supabase
    .from("change_orders")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const totalApproved =
    changeOrders
      ?.filter((co) => co.status === "approved")
      .reduce((sum, co) => sum + (Number(co.total_amount) || 0), 0) || 0;

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    approved:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    void: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
    invoiced:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" render={<Link href="/projects" />}>
            <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.address && (
            <p className="text-base text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {project.address}
            </p>
          )}
        </div>
        <Button render={<Link href={`/change-orders/new?project=${id}`} />}>
            <Plus className="mr-2 h-4 w-4" />
            New CO
        </Button>
      </div>

      {/* Client info */}
      {(project.client_name || project.client_email || project.client_phone) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-base">
            {project.client_name && (
              <p className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                {project.client_name}
              </p>
            )}
            {project.client_email && (
              <p className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-muted-foreground" />
                {project.client_email}
              </p>
            )}
            {project.client_phone && (
              <p className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-muted-foreground" />
                {project.client_phone}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* CO summary */}
      <div className="flex gap-3">
        <Card className="flex-1">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{changeOrders?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Total COs</p>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              ${totalApproved.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Approved Value</p>
          </CardContent>
        </Card>
      </div>

      {/* CO list */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Change Orders</CardTitle>
          <CsvExportButton
            changeOrders={changeOrders || []}
            projectName={project.name}
          />
        </CardHeader>
        <CardContent>
          {!changeOrders || changeOrders.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground text-base">
              No change orders for this project yet
            </p>
          ) : (
            <div className="space-y-2">
              {changeOrders.map((co) => (
                <Link
                  key={co.id}
                  href={`/change-orders/${co.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">
                        {co.co_number}
                      </span>
                      <Badge
                        variant="secondary"
                        className={statusColors[co.status] || ""}
                      >
                        {co.status}
                      </Badge>
                    </div>
                    <p className="font-medium text-base mt-0.5">{co.title}</p>
                  </div>
                  <p className="font-semibold text-base">
                    $
                    {Number(
                      co.total_amount || co.fixed_amount || 0
                    ).toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
