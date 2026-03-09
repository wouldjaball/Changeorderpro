import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, company_id, role")
    .eq("id", user.id)
    .single();

  // If user has no company, redirect to company setup
  if (!profile?.company_id) {
    redirect("/company-setup");
  }

  // Fetch company name separately for type safety
  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", profile.company_id)
    .single();

  const companyName = company?.name;

  return (
    <div className="flex min-h-svh flex-col">
      <TopBar
        userName={profile?.full_name}
        companyName={companyName}
      />
      <div className="flex flex-1">
        <DesktopSidebar />
        <main className="flex-1 pb-20 md:pb-4 px-4 py-4 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
