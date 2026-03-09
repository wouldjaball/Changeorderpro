export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, MapPin } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
};

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user!.id)
    .single();

  const { data: projects } = await supabase
    .from("projects")
    .select("*, change_orders(count)")
    .eq("company_id", profile!.company_id!)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button render={<Link href="/projects/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
        </Button>
      </div>

      {!projects || projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No projects yet</p>
            <p className="text-sm mt-1">
              Add your first project to start creating change orders
            </p>
            <Button className="mt-4" render={<Link href="/projects/new" />}>
                <Plus className="mr-2 h-4 w-4" />
                Add Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      {project.address && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {project.address}
                        </p>
                      )}
                      {project.client_name && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Client: {project.client_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {Array.isArray(project.change_orders) &&
                        project.change_orders[0] && (
                          <span>
                            {(project.change_orders[0] as { count: number }).count} COs
                          </span>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
