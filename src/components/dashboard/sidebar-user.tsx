"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import type { DashboardUser } from "./app-sidebar";

export default function SidebarUser({ user }: { user: DashboardUser }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogout() {
    setMessage("");
    setBusy(true);
    const { error } = await dashboardApiRequest<{ success: boolean }>("/api/dashboard/logout", {
      method: "POST",
    });
    setBusy(false);
    if (error) {
      setMessage(error);
      return;
    }
    router.replace("/login");
    router.refresh();
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
      {message && <p className="mt-2 text-[12px] leading-4 text-red-600">{message}</p>}
    </div>
  );
}
