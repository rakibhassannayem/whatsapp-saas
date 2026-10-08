"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Building2,
  CreditCard,
  LayoutDashboard,
  ScrollText,
} from "lucide-react";
import PlatformAdminLogoutButton from "@/components/platform-admin/platform-admin-logout-button";

const navigation = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/businesses", label: "Business & owners", icon: Building2 },
  { href: "/admin/campaigns", label: "Campaign activity", icon: Activity },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: ScrollText },
  { href: "/admin/billing", label: "Payment history", icon: CreditCard },
];

function NavigationLinks() {
  const pathname = usePathname();

  return navigation.map(({ href, label, icon: Icon }) => {
    const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          active
            ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/15"
            : "text-slate-400 hover:bg-white/5 hover:text-white"
        }`}
      >
        <Icon className="size-[18px]" />
        {label}
      </Link>
    );
  });
}

export default function PlatformAdminSidebar({
  email,
}: {
  email: string | undefined;
}) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-white/[0.07] bg-[#0a1512] px-4 py-5 text-white lg:flex">
        <Link href="/admin" className="flex items-center gap-3 px-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-400 text-[#062019]">
            <Building2 className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-bold">Broadcastly</span>
            <span className="mt-0.5 block text-[11px] text-emerald-300">Platform console</span>
          </span>
        </Link>

        <div className="mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
          Management
        </div>
        <nav className="mt-3 flex flex-1 flex-col gap-1">
          <NavigationLinks />
        </nav>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-emerald-300/10 text-sm font-semibold text-emerald-200">
              {(email?.[0] ?? "A").toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-white">Platform admin</span>
              <span className="block truncate text-[11px] text-slate-500">{email}</span>
            </span>
          </div>
          <div className="mt-3 [&_button]:w-full [&_button]:justify-center [&_button]:border-white/10 [&_button]:text-slate-300 [&_button]:hover:bg-white/5">
            <PlatformAdminLogoutButton />
          </div>
        </div>
      </aside>

      <header className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-slate-900">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <Building2 className="size-4" />
            </span>
            Platform Admin
          </Link>
          <PlatformAdminLogoutButton />
        </div>
        <nav className="mt-3 flex gap-1 overflow-x-auto pb-1">
          <NavigationLinks />
        </nav>
      </header>
    </>
  );
}
