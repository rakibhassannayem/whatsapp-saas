"use client";

import { useState } from "react";
import Link from "next/link";
import AuthAwareLink from "@/components/common/auth-aware-link";
import { useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, Megaphone } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { showToast } from "@/components/ui/toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPositioner,
  DropdownMenuPopup,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { NavUser } from "@/types/auth";

function toNavUser(name: string | null | undefined, email: string | null | undefined): NavUser | null {
  if (!email && !name) return null;
  const displayName = name || (email ? email.split("@")[0] : "User");
  return {
    email: email ?? null,
    displayName,
    initial: (displayName.charAt(0) || "U").toUpperCase(),
  };
}

export default function NavUserMenu() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);

  const user = session?.user
    ? toNavUser(session.user.name, session.user.email)
    : null;

  async function handleLogout() {
    setLoggingOut(true);
    showToast("Logged out", "You have been signed out.");
    try {
      await fetch("/api/dashboard/logout", { method: "POST" });
    } catch {
      // ignore
    }
    await signOut({ callbackUrl: "/" });
  }

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden h-8 w-28 animate-pulse rounded-full bg-slate-100 sm:block" />
        <span className="size-8 animate-pulse rounded-full bg-slate-100" />
      </div>
    );
  }

  if (status === "unauthenticated" || !user) {
    return (
      <div className="flex items-center gap-1.5">
        <AuthAwareLink
          href="/login"
          className="rounded-full px-4 py-2 text-[12px] font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
        >
          LOG IN
        </AuthAwareLink>
        <AuthAwareLink
          href="/signup"
          className="rounded-full bg-emerald-500 px-4 py-2 text-[12px] font-bold text-white hover:bg-emerald-600"
        >
          START BROADCASTING
        </AuthAwareLink>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/dashboard/campaigns"
        className="hidden items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-[12px] font-bold text-white hover:bg-emerald-600 sm:flex"
      >
        <Megaphone className="size-3.5" />
        NEW ANNOUNCEMENT
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2 shadow-sm transition outline-none hover:border-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-200">
          <span className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-[13px] font-bold text-white">
            {user.initial}
          </span>
          <ChevronDown className="size-3.5 text-slate-500" />
        </DropdownMenuTrigger>
        <DropdownMenuPositioner>
          <DropdownMenuPopup>
            <DropdownMenuLabel>
              <p className="truncate text-[13px] font-bold text-slate-900">{user.displayName}</p>
              {user.email && <p className="truncate text-[12px] text-slate-500">{user.email}</p>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-1.5">
              <DropdownMenuLinkItem
                href="/dashboard"
                closeOnClick
              >
                <LayoutDashboard />
                Dashboard
              </DropdownMenuLinkItem>
              <DropdownMenuItem
                disabled={loggingOut}
                onClick={handleLogout}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 focus-visible:bg-red-50"
              >
                <LogOut />
                {loggingOut ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </div>
          </DropdownMenuPopup>
        </DropdownMenuPositioner>
      </DropdownMenu>
    </div>
  );
}
