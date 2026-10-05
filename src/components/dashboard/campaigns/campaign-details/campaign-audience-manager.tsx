"use client";

import { useMemo, useState } from "react";
import { Check, CheckCheck, Search, Tag as TagIcon, Trash2, Users } from "lucide-react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import type {
  CampaignAudienceManagerProps,
} from "@/types/campaign";

export default function CampaignAudienceManager({
  campaignId,
  initialCustomers,
  initialRecipients,
  initialTags,
  initialCustomerTags,
}: CampaignAudienceManagerProps) {
  const [selectedCustomerIds, setSelectedCustomerIds] = useState(
    () => new Set(initialRecipients.map((recipient) => recipient.customer_id)),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [busy, setBusy] = useState(false);

  // Filter customers by search term
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return initialCustomers;
    const q = searchQuery.toLowerCase().trim();
    return initialCustomers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.phone_e164.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)),
    );
  }, [initialCustomers, searchQuery]);

  // Customer ID to assigned tags map
  const tagsByCustomerId = useMemo(() => {
    const map = new Map<string, string[]>();
    const tagNames = new Map(initialTags.map((t) => [t.id, t.name]));
    for (const item of initialCustomerTags) {
      const existing = map.get(item.customer_id) ?? [];
      const name = tagNames.get(item.tag_id);
      if (name) {
        existing.push(name);
      }
      map.set(item.customer_id, existing);
    }
    return map;
  }, [initialTags, initialCustomerTags]);

  async function handleToggleCustomer(
    customerId: string,
    shouldSelect: boolean,
  ) {
    setMessage(null);
    setBusy(true);

    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/campaigns/recipients",
      shouldSelect
        ? {
            method: "POST",
            body: { campaignId, customerIds: [customerId] },
          }
        : {
            method: "DELETE",
            body: { campaignId, customerId },
          },
    );

    setBusy(false);

    if (error) {
      setMessage({ text: error, type: "error" });
      return;
    }

    setSelectedCustomerIds((current) => {
      const next = new Set(current);
      if (shouldSelect) {
        next.add(customerId);
      } else {
        next.delete(customerId);
      }
      return next;
    });

    setMessage({
      text: shouldSelect
        ? "Contact added to audience."
        : "Contact removed from audience.",
      type: "success",
    });
  }

  async function handleAddCustomersWithTag(tagId: string, tagName: string) {
    const taggedCustomerIds = initialCustomerTags
      .filter((item) => item.tag_id === tagId)
      .map((item) => item.customer_id);

    const customerIdsToAdd = taggedCustomerIds.filter(
      (customerId) => !selectedCustomerIds.has(customerId),
    );

    if (customerIdsToAdd.length === 0) {
      setMessage({
        text:
          taggedCustomerIds.length === 0
            ? `No customers found with the tag "${tagName}".`
            : `All contacts with "${tagName}" are already in the audience.`,
        type: "info",
      });
      return;
    }

    setMessage(null);
    setBusy(true);

    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/campaigns/recipients",
      {
        method: "POST",
        body: { campaignId, customerIds: customerIdsToAdd },
      },
    );

    setBusy(false);

    if (error) {
      setMessage({ text: error, type: "error" });
      return;
    }

    setSelectedCustomerIds((current) => {
      const next = new Set(current);
      customerIdsToAdd.forEach((id) => next.add(id));
      return next;
    });

    setMessage({
      text: `Added ${customerIdsToAdd.length} contact${customerIdsToAdd.length === 1 ? "" : "s"} tagged "${tagName}" to the audience.`,
      type: "success",
    });
  }

  async function handleSelectAllFiltered() {
    const idsToAdd = filteredCustomers
      .map((c) => c.id)
      .filter((id) => !selectedCustomerIds.has(id));

    if (idsToAdd.length === 0) {
      setMessage({
        text: "All displayed contacts are already selected.",
        type: "info",
      });
      return;
    }

    setMessage(null);
    setBusy(true);

    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/campaigns/recipients",
      {
        method: "POST",
        body: {
          campaignId,
          customerIds: idsToAdd,
        },
      },
    );

    setBusy(false);

    if (error) {
      setMessage({ text: error, type: "error" });
      return;
    }

    setSelectedCustomerIds((current) => {
      const next = new Set(current);
      idsToAdd.forEach((id) => next.add(id));
      return next;
    });

    setMessage({
      text: `Added ${idsToAdd.length} contact${idsToAdd.length === 1 ? "" : "s"} to audience.`,
      type: "success",
    });
  }

  async function handleClearSelection() {
    if (selectedCustomerIds.size === 0) {
      setMessage({ text: "No contacts are currently selected.", type: "info" });
      return;
    }

    const confirmed = window.confirm(
      "Remove all contacts from this campaign's audience?",
    );

    if (!confirmed) return;

    setMessage(null);
    setBusy(true);

    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/campaigns/recipients",
      { method: "DELETE", body: { campaignId } },
    );

    setBusy(false);

    if (error) {
      setMessage({ text: error, type: "error" });
      return;
    }

    setSelectedCustomerIds(new Set());
    setMessage({ text: "All contacts removed from audience.", type: "success" });
  }

  return (
    <section className="mt-8 space-y-6">
      {/* Header & Quick stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[16px] font-bold text-slate-950">Campaign Audience</h2>
          <p className="mt-0.5 text-[13px] text-slate-500">
            Select the contacts who will receive this broadcast campaign.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
            <Users className="size-3.5" />
            {selectedCustomerIds.size} of {initialCustomers.length} selected
          </span>

          <button
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            type="button"
            disabled={busy || initialCustomers.length === 0}
            onClick={() => void handleSelectAllFiltered()}
          >
            <CheckCheck className="size-3.5 text-slate-500" />
            Select {searchQuery.trim() ? "filtered" : "all"}
          </button>

          <button
            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            type="button"
            disabled={busy || selectedCustomerIds.size === 0}
            onClick={() => void handleClearSelection()}
          >
            <Trash2 className="size-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Tag quick-add bar */}
      {initialTags.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <TagIcon className="size-4 text-emerald-600" />
            <h3 className="text-[13px] font-bold text-slate-900">Add by Tag</h3>
          </div>
          <p className="mt-1 text-[12px] text-slate-500">
            Quickly include all contacts grouped under specific tags.
          </p>

          <div className="mt-3.5 flex flex-wrap gap-2">
            {initialTags.map((tag) => {
              const taggedCustomerIds = initialCustomerTags
                .filter((item) => item.tag_id === tag.id)
                .map((item) => item.customer_id);

              const availableCount = taggedCustomerIds.filter(
                (id) => !selectedCustomerIds.has(id),
              ).length;
              const isAllAdded = taggedCustomerIds.length > 0 && availableCount === 0;

              return (
                <button
                  key={tag.id}
                  type="button"
                  disabled={busy || availableCount === 0}
                  onClick={() => void handleAddCustomersWithTag(tag.id, tag.name)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-medium transition ${
                    isAllAdded
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 opacity-80"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <span>{tag.name}</span>
                  {isAllAdded ? (
                    <span className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600">
                      <Check className="size-3" /> All in
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                      +{availableCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Customer search & list */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[13px] outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <p className="text-[12px] text-slate-500">
            Showing <span className="font-semibold text-slate-900">{filteredCustomers.length}</span> of{" "}
            {initialCustomers.length} contacts
          </p>
        </div>

        {initialCustomers.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <Users className="mx-auto size-8 text-slate-300" />
            <p className="mt-2 text-[14px] font-semibold text-slate-700">No contacts available</p>
            <p className="mt-1 text-[13px] text-slate-500">
              Add or import customers first on the Customers page to build your campaign audience.
            </p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <Search className="mx-auto size-8 text-slate-300" />
            <p className="mt-2 text-[14px] font-semibold text-slate-700">No matching contacts</p>
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
                        void handleToggleCustomer(customer.id, e.currentTarget.checked)
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

      {/* Status banner */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] ${
            message.type === "error"
              ? "bg-red-50 text-red-700 border border-red-100"
              : message.type === "info"
              ? "bg-blue-50 text-blue-700 border border-blue-100"
              : "bg-emerald-50 text-emerald-800 border border-emerald-100"
          }`}
          role="status"
        >
          <span>{message.text}</span>
        </div>
      )}
    </section>
  );
}
