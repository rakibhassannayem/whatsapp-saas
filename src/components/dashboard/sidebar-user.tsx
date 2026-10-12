"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { showToast } from "@/components/ui/toast";
import type { DashboardUser } from "./app-sidebar";

export default function SidebarUser({ user }: { user: DashboardUser }) {
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    showToast("Logged out", "You have been signed out.");
    try {
      await fetch("/api/dashboard/logout", { method: "POST" });
    } catch {
      // ignore
    }
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[14px] font-bold text-white">
          {user.initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-slate-900">{user.displayName}</p>
          {user.email && <p className="truncate text-[11px] text-slate-500">{user.email}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={busy}
        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
      >
        <LogOut className="size-3.5" />
        {busy ? "Logging out..." : "Log out"}
      </button>
    </div>
  );
}
