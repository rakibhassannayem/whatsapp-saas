import { createClient } from "@/lib/supabase/server";
import { SidebarContent } from "@/components/dashboard/app-sidebar";
import DashboardMobileNav from "@/components/dashboard/dashboard-mobile-nav";
import type { DashboardLayoutProps, DashboardUser } from "@/types/dashboard";

async function getSidebarUser(): Promise<DashboardUser> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const email = user?.email ?? null;
  const fullName =
    user?.user_metadata && typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  const displayName = fullName || (email ? email.split("@")[0] : null) || "Signed-in user";
  return {
    displayName,
    email,
    initial: (displayName.charAt(0) || "U").toUpperCase(),
  };
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getSidebarUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardMobileNav user={user} />
      <aside className="fixed inset-y-0 left-0 hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <SidebarContent user={user} />
      </aside>
      <div className="min-w-0 lg:pl-64">
        <div className="mx-auto max-w-6xl p-5 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
