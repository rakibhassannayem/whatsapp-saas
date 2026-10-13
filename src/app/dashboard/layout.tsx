import { redirect } from "next/navigation";
import { SidebarContent } from "@/components/dashboard/app-sidebar";
import DashboardMobileNav from "@/components/dashboard/dashboard-mobile-nav";
import type { DashboardLayoutProps, DashboardUser } from "@/types/dashboard";
import { getActiveDashboardBusiness, getDashboardBusinesses } from "@/lib/dashboard-business";
import { auth } from "@/auth";

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const email = session.user.email ?? null;
  const name = session.user.name ?? "";
  const displayName = name || (email ? email.split("@")[0] : null) || "Signed-in user";

  const user: DashboardUser = {
    displayName,
    email,
    initial: (displayName.charAt(0) || "U").toUpperCase(),
  };

  const { data: businesses } = await getDashboardBusinesses(session.user.id);
  const availableBusinesses = businesses ?? [];
  const activeBusiness = await getActiveDashboardBusiness(availableBusinesses);

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardMobileNav
        user={user}
        businesses={availableBusinesses}
        activeBusinessId={activeBusiness?.id ?? null}
      />
      <aside className="fixed inset-y-0 left-0 hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <SidebarContent
          user={user}
          businesses={availableBusinesses}
          activeBusinessId={activeBusiness?.id ?? null}
        />
      </aside>
      <div className="min-w-0 lg:pl-64">
        <div className="mx-auto max-w-6xl p-5 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
