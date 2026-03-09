export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Wrench, HardHat } from "lucide-react";
import type { Metadata } from "next";
import { InviteTeamMember } from "@/components/team/invite-form";

export const metadata: Metadata = {
  title: "Team",
};

const roleConfig: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: "Admin", icon: Shield, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
  pm: { label: "Project Manager", icon: Wrench, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  contractor: { label: "Contractor", icon: HardHat, color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
};

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("company_id, role")
    .eq("id", user!.id)
    .single();

  const companyId = profile?.company_id;
  const isAdmin = profile?.role === "admin";

  const { data: members } = await supabase
    .from("users")
    .select("id, full_name, email, phone, role, is_active, created_at")
    .eq("company_id", companyId!)
    .order("created_at");

  const activeCount = members?.filter((m) => m.is_active).length || 0;

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-sm text-muted-foreground">
            {activeCount} active member{activeCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Invite form (admin only) */}
      {isAdmin && <InviteTeamMember />}

      {/* Team members list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Members</CardTitle>
        </CardHeader>
        <CardContent>
          {!members || members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No team members yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const role = roleConfig[member.role] || roleConfig.contractor;
                const RoleIcon = role.icon;
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm shrink-0">
                        {member.full_name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {member.full_name}
                          {member.id === user!.id && (
                            <span className="text-muted-foreground ml-1">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className={role.color}>
                        <RoleIcon className="mr-1 h-3 w-3" />
                        {role.label}
                      </Badge>
                      {!member.is_active && (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
