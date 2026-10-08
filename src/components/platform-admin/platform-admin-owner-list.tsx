"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Building2, Search, UsersRound } from "lucide-react";
import type { PlatformAdminBusinessUser } from "@/types/platform-admin";

export type PlatformAdminOwnerSummary = {
  owner: PlatformAdminBusinessUser;
  businessCount: number;
};

export default function PlatformAdminOwnerList({
  owners,
}: {
  owners: PlatformAdminOwnerSummary[];
}) {
  const [search, setSearch] = useState("");
  const visibleOwners = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return owners;
    return owners.filter(({ owner }) =>
      `${owner.fullName ?? ""} ${owner.email ?? ""}`
        .toLocaleLowerCase()
        .includes(term),
    );
  }, [owners, search]);

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Business owners</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose an owner to review their businesses and account details.
          </p>
        </div>
        <label className="relative block w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <span className="sr-only">Search owners</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
        </label>
      </div>

      {owners.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <UsersRound className="size-5" />
          </span>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">No business owners found</h3>
          <p className="mt-1 text-sm text-slate-500">Owner accounts will appear here after they create a business.</p>
        </div>
      ) : visibleOwners.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-slate-500">No owners match this search.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visibleOwners.map(({ owner, businessCount }) => {
            const name = owner.fullName?.trim() || owner.email || "Unnamed owner";
            return (
              <li key={owner.id}>
                <Link
                  href={`/admin/businesses/${owner.id}`}
                  className="group flex flex-col gap-4 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:px-6"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-800">
                    {(name[0] ?? "U").toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">{name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          owner.status === "suspended"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {owner.status === "suspended" ? "Suspended" : "Active"}
                      </span>
                    </span>
                    {owner.fullName && owner.email && (
                      <span className="mt-0.5 block truncate text-sm text-slate-500">{owner.email}</span>
                    )}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-slate-600 sm:mr-4">
                    <Building2 className="size-4 text-slate-400" />
                    {businessCount} {businessCount === 1 ? "business" : "businesses"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
                    View details
                    <ArrowUpRight className="size-3.5" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-slate-500 sm:px-6">
        Showing {visibleOwners.length} of {owners.length} owners
      </div>
    </section>
  );
}
