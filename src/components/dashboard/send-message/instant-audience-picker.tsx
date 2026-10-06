"use client";

import { useMemo, useState } from "react";
import { CheckCheck, Search, Tag as TagIcon, Users } from "lucide-react";
import type { Customer, CustomerTag, Tag } from "@/types/customer";

interface InstantAudiencePickerProps {
  customers: Customer[];
  initialTags: Tag[];
  initialCustomerTags: CustomerTag[];
  selectedIds: Set<string>;
  onToggleCustomer: (customerId: string, checked: boolean) => void;
  onSelectAllFiltered: (filteredIds: string[]) => void;
  onClearSelection: () => void;
  onToggleTag: (tagName: string, customerIds: string[]) => void;
}

export default function InstantAudiencePicker({
  customers,
  initialTags,
  initialCustomerTags,
  selectedIds,
  onToggleCustomer,
  onSelectAllFiltered,
  onClearSelection,
  onToggleTag,
}: InstantAudiencePickerProps) {
  const [search, setSearch] = useState("");

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(
      (customer) =>
        customer.full_name.toLowerCase().includes(query) ||
        customer.phone_e164.toLowerCase().includes(query) ||
        (customer.email?.toLowerCase().includes(query) ?? false),
    );
  }, [customers, search]);

  return (
    <section className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[14px] font-bold text-slate-900">
            Select Audience
          </h3>
          <p className="mt-0.5 text-[12px] text-slate-500">
            Choose the customers who should receive this instant message.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
          <Users className="size-3.5" />
          {selectedIds.size} of {customers.length} selected
        </span>
      </div>

      {initialTags.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <TagIcon className="size-3.5 text-emerald-600" />
            <h4 className="text-[12px] font-semibold text-slate-800">
              Add customers by tag
            </h4>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {initialTags.map((tag) => {
              const taggedCustomers = initialCustomerTags
                .filter((item) => item.tag_id === tag.id)
                .map((item) => item.customer_id);
              const availableCount = taggedCustomers.filter(
                (id) => !selectedIds.has(id),
              ).length;
              const allTaggedCustomersSelected =
                taggedCustomers.length > 0 && availableCount === 0;

              return (
                <button
                  key={tag.id}
                  type="button"
                  disabled={taggedCustomers.length === 0}
                  aria-label={
                    allTaggedCustomersSelected
                      ? `Remove customers with ${tag.name} tag from audience`
                      : `Add customers with ${tag.name} tag to audience`
                  }
                  onClick={() => onToggleTag(tag.name, taggedCustomers)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    allTaggedCustomersSelected
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50"
                  }`}
                >
                  <span>{tag.name}</span>
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                    {allTaggedCustomersSelected
                      ? "Added · click to remove"
                      : `+${availableCount}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block sm:max-w-md sm:flex-1">
          <span className="sr-only">Search customers</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            placeholder="Search name, phone, or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            type="button"
            disabled={
              customers.length === 0 ||
              filteredCustomers.every((customer) => selectedIds.has(customer.id))
            }
            onClick={() => onSelectAllFiltered(filteredCustomers.map((c) => c.id))}
          >
            <CheckCheck className="size-3.5" />
            Select {search.trim() ? "filtered" : "all"}
          </button>
          <button
            className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            type="button"
            disabled={selectedIds.size === 0}
            onClick={onClearSelection}
          >
            Clear
          </button>
        </div>
      </div>

      {customers.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-white p-5 text-center text-[13px] text-slate-500">
          Add or import customers first to select an audience.
        </p>
      ) : filteredCustomers.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-white p-5 text-center text-[13px] text-slate-500">
          No customers match your search.
        </p>
      ) : (
        <ul className="mt-4 max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-white">
          {filteredCustomers.map((customer) => (
            <li key={customer.id}>
              <label className="flex cursor-pointer items-center gap-3 p-3 transition hover:bg-slate-50">
                <input
                  className="size-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
                  type="checkbox"
                  checked={selectedIds.has(customer.id)}
                  onChange={(event) =>
                    onToggleCustomer(customer.id, event.currentTarget.checked)
                  }
                />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-slate-900">
                    {customer.full_name}
                  </span>
                  <span className="block truncate text-[12px] text-slate-500">
                    {customer.phone_e164}
                    {customer.email ? ` · ${customer.email}` : ""}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
