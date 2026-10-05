"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { dashboardApiRequest } from "@/lib/dashboard-api";
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

function toNavUser(email: string | undefined, fullName: unknown): NavUser | null {
  if (!email) return null;
  const name = typeof fullName === "string" ? fullName.trim() : "";
  const displayName = name || email.split("@")[0] || email;
  return {
    email,
    displayName,
    initial: (displayName.charAt(0) || "U").toUpperCase(),
  };
}

export default function NavUserMenu() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "signed-out" | "signed-in">("loading");
  const [user, setUser] = useState<NavUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const u = data.user;
      const navUser = toNavUser(u?.email, u?.user_metadata?.full_name);
      setUser(navUser);
      setStatus(navUser ? "signed-in" : "signed-out");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const u = session?.user;
      const navUser = toNavUser(u?.email, u?.user_metadata?.full_name);
      setUser(navUser);
      setStatus(navUser ? "signed-in" : "signed-out");
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    const { error } = await dashboardApiRequest<{ success: boolean }>("/api/dashboard/logout", {
      method: "POST",
    });
    setLoggingOut(false);
    if (error) {
      showToast("Could not log out", error, "error");
      return;
    }
    setUser(null);
    setStatus("signed-out");
    showToast("Logged out", "You have been signed out.");
    router.replace("/");
    router.refresh();
  }

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden h-8 w-28 animate-pulse rounded-full bg-slate-100 sm:block" />
        <span className="size-8 animate-pulse rounded-full bg-slate-100" />
      </div>
    );
  }

  if (status === "signed-out" || !user) {
    return (
      <div className="flex items-center gap-1.5">
        <Link
          href="/login"
          className="rounded-full px-4 py-2 text-[12px] font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
        >
          LOG IN
        </Link>
        <Link
          href="/signup"
          className="rounded-full bg-emerald-500 px-4 py-2 text-[12px] font-bold text-white hover:bg-emerald-600"
        >
          START BROADCASTING
        </Link>
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
