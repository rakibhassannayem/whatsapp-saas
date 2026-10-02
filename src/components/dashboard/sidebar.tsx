import Link from "next/link";
import {
  FileText,
  LayoutDashboard,
  Megaphone,
  Tags,
  UsersRound,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Customers", href: "/dashboard/customers", icon: UsersRound },
  { label: "Tags", href: "/dashboard/tags", icon: Tags },
  { label: "Templates", href: "/dashboard/templates", icon: FileText },
  { label: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
];

export default function DashboardSidebar() {
  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 flex h-screen flex-col px-4 py-6">
          <Link
            className="mb-8 px-3 text-sm font-semibold text-slate-950"
            href="/dashboard"
          >
            Workspace
          </Link>
          <nav className="space-y-1" aria-label="Dashboard navigation">
            {navigation.map(({ label, href, icon: Icon }) => (
              <Link
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800"
                href={href}
                key={label}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <nav
        className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden"
        aria-label="Dashboard navigation"
      >
        {navigation.map(({ label, href }) => (
          <Link
            className="shrink-0 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
            href={href}
            key={label}
          >
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
