"use client";

import { Search, Users } from "lucide-react";
import type { Customer } from "@/types/customer";

interface AudienceCustomerListProps {
  initialCustomers: Customer[];
  filteredCustomers: Customer[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCustomerIds: Set<string>;
  tagsByCustomerId: Map<string, string[]>;
  busy: boolean;
  onToggleCustomer: (customerId: string, selected: boolean) => void;
}

export default function AudienceCustomerList({
  initialCustomers,
  filteredCustomers,
  searchQuery,
  onSearchChange,
  selectedCustomerIds,
  tagsByCustomerId,
  busy,
  onToggleCustomer,
}: AudienceCustomerListProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search contacts by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[13px] outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <p className="text-[12px] text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-900">
            {filteredCustomers.length}
          </span>{" "}
          of {initialCustomers.length} contacts
        </p>
      </div>

      {initialCustomers.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center">
          <Users className="mx-auto size-8 text-slate-300" />
          <p className="mt-2 text-[14px] font-semibold text-slate-700">
            No contacts available
          </p>
          <p className="mt-1 text-[13px] text-slate-500">
            Add or import customers first on the Customers page to build your campaign audience.
          </p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center">
          <Search className="mx-auto size-8 text-slate-300" />
          <p className="mt-2 text-[14px] font-semibold text-slate-700">
            No matching contacts
          </p>
          <p className="mt-1 text-[13px] text-slate-500">
            Try adjusting your search query to find contacts.
          </p>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          {filteredCustomers.map((customer) => {
            const selected = selectedCustomerIds.has(customer.id);
            const tags = tagsByCustomerId.get(customer.id) ?? [];

            return (
              <label
                key={customer.id}
                className={`flex cursor-pointer items-center justify-between gap-3 p-3.5 transition ${
                  selected ? "bg-emerald-50/40" : "hover:bg-slate-50/60"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={busy}
                    onChange={(e) =>
                      onToggleCustomer(customer.id, e.currentTarget.checked)
                    }
                    className="size-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
                  />

                  {/* Initials badge */}
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                    {customer.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[13px] font-semibold text-slate-900">
                        {customer.full_name}
                      </span>
                      {tags.map((tagName) => (
                        <span
                          key={tagName}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                        >
                          {tagName}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-slate-500">
                      <span>{customer.phone_e164}</span>
                      {customer.email && (
                        <span className="text-slate-400">· {customer.email}</span>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                    selected
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {selected ? "Selected" : "Not in audience"}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </section>
  );
}
