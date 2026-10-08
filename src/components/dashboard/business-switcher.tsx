"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown, Plus } from "lucide-react";

type Business = { id: string; name: string };

export default function BusinessSwitcher({
  businesses,
  activeBusinessId,
}: {
  businesses: Business[];
  activeBusinessId: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (businesses.length === 0) return null;

  async function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const businessId = event.target.value;
    if (!businessId || businessId === activeBusinessId) return;

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/dashboard/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not switch business.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not switch business.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <label className="mb-2 flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        <Building2 className="size-3.5" />
        Current business
      </label>
      <div className="relative">
        <select
          aria-label="Select business"
          className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-[13px] font-semibold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
          value={activeBusinessId ?? businesses[0].id}
          onChange={handleChange}
          disabled={busy}
        >
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      </div>
      <Link
        href="/onboarding"
        className="mt-2 inline-flex items-center gap-1.5 px-1 text-xs font-semibold text-emerald-700 transition hover:text-emerald-800"
      >
        <Plus className="size-3.5" />
        Add another business
      </Link>
      {busy && <p className="mt-2 px-1 text-xs text-slate-500">Switching business…</p>}
      {error && <p className="mt-2 px-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
