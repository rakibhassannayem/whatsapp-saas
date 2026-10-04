"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  MessagesSquare,
  Megaphone,
  Send,
  Tags,
  Upload,
  UsersRound,
} from "lucide-react";
import { cn } from "cn";
import { Separator } from "@/components/ui/separator";
import SidebarUser from "./sidebar-user";

export type DashboardUser = {
  displayName: string;
  email: string | null;
  initial: string;
};

const GROUPS: {
  label: string;
  items: { label: string; href: string; icon: typeof UsersRound; match: (path: string) => boolean }[];
}[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        match: (p) => p === "/dashboard",
      },
    ],
  },
  {
    label: "Broadcast",
    items: [
      {
        label: "Send message",
        href: "/dashboard/send-message",
        icon: Send,
        match: (p) => p === "/dashboard/send-message",
      },
      {
        label: "Campaigns",
        href: "/dashboard/campaigns",
        icon: Megaphone,
        match: (p) => p.startsWith("/dashboard/campaigns"),
      },
      {
        label: "Templates",
        href: "/dashboard/templates",
        icon: FileText,
        match: (p) => p.startsWith("/dashboard/templates"),
      },
      {
        label: "Tags",
        href: "/dashboard/tags",
        icon: Tags,
        match: (p) => p.startsWith("/dashboard/tags"),
      },
    ],
  },
  {
    label: "Audience",
    items: [
      {
        label: "Customers",
        href: "/dashboard/customers",
        icon: UsersRound,
        match: (p) => p === "/dashboard/customers" || p === "/dashboard/customers/new",
      },
      {
        label: "Import",
        href: "/dashboard/customers/import",
        icon: Upload,
        match: (p) => p.startsWith("/dashboard/customers/import"),
      },
    ],
  },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-6" aria-label="Dashboard navigation">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {group.label}
          </p>
          <div className="mt-2 space-y-1">
            {group.items.map(({ label, href, icon: Icon, match }) => {
              const active = match(pathname);
              return (
                <Link
                  key={label}
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition",
                    active
                      ? "bg-emerald-50 font-semibold text-emerald-800"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  )}
                >
                  <Icon
                    className={cn("size-4 shrink-0", active ? "text-emerald-600" : "text-slate-400")}
                    aria-hidden="true"
                  />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function SidebarContent({ user, onNavigate }: { user: DashboardUser; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col px-4 py-6">
      <Link href="/" onClick={onNavigate} className="flex items-center gap-2 px-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <MessagesSquare className="size-4" />
        </span>
        <span className="text-[15px] font-bold tracking-tight text-slate-950">
          WhatsApp<span className="text-emerald-600"> Broadcast</span>
        </span>
      </Link>
      <div className="mt-8 min-h-0 flex-1 overflow-y-auto">
        <SidebarNav onNavigate={onNavigate} />
      </div>
      <div className="mt-6">
        <Separator className="mb-4" />
        <SidebarUser user={user} />
      </div>
    </div>
  );
}
