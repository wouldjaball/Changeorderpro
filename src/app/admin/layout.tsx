import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/auth";
import { Sidebar } from "@/components/admin/shell/Sidebar";
import { TopBar } from "@/components/admin/shell/TopBar";
import { headers } from "next/headers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = user?.email && isAdminEmail(user.email);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activePath={pathname} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar email={user.email || ""} />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-[1440px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
