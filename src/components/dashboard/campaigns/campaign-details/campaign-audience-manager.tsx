"use client";

import { useMemo, useState } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Check, CheckCheck, Search, Tag as TagIcon, Trash2, Users } from "lucide-react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import { showToast } from "@/components/ui/toast";
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
  const [busy, setBusy] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

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
      showToast("Could not update audience", error, "error");
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

    showToast(
      shouldSelect ? "Contact added to audience" : "Contact removed from audience",
    );
  }

  async function handleAddCustomersWithTag(tagId: string, tagName: string) {
    const taggedCustomerIds = initialCustomerTags
      .filter((item) => item.tag_id === tagId)
      .map((item) => item.customer_id);

    if (taggedCustomerIds.length === 0) {
      showToast(
        "No customers found",
        `No customers found with the tag "${tagName}".`,
        "info",
      );
      return;
    }

    const allTaggedCustomersSelected = taggedCustomerIds.every((customerId) =>
      selectedCustomerIds.has(customerId),
    );
    const customerIdsToUpdate = allTaggedCustomersSelected
      ? taggedCustomerIds
      : taggedCustomerIds.filter(
          (customerId) => !selectedCustomerIds.has(customerId),
        );

    setBusy(true);

    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/campaigns/recipients",
      allTaggedCustomersSelected
        ? {
            method: "DELETE",
            body: { campaignId, customerIds: customerIdsToUpdate },
          }
        : {
            method: "POST",
            body: { campaignId, customerIds: customerIdsToUpdate },
          },
    );

    setBusy(false);

    if (error) {
      showToast("Could not update audience", error, "error");
      return;
    }

    setSelectedCustomerIds((current) => {
      const next = new Set(current);
      customerIdsToUpdate.forEach((id) => {
        if (allTaggedCustomersSelected) {
          next.delete(id);
        } else {
          next.add(id);
        }
      });
      return next;
    });

    showToast(
      allTaggedCustomersSelected ? "Customers removed from audience" : "Customers added to audience",
      allTaggedCustomersSelected
        ? `Removed ${customerIdsToUpdate.length} contact${customerIdsToUpdate.length === 1 ? "" : "s"} tagged "${tagName}" from the audience.`
        : `Added ${customerIdsToUpdate.length} contact${customerIdsToUpdate.length === 1 ? "" : "s"} tagged "${tagName}" to the audience.`,
    );
  }

  async function handleSelectAllFiltered() {
    const idsToAdd = filteredCustomers
      .map((c) => c.id)
      .filter((id) => !selectedCustomerIds.has(id));

    if (idsToAdd.length === 0) {
      showToast(
        "Audience unchanged",
        "All displayed contacts are already selected.",
        "info",
      );
      return;
    }

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
      showToast("Could not update audience", error, "error");
      return;
    }

    setSelectedCustomerIds((current) => {
      const next = new Set(current);
      idsToAdd.forEach((id) => next.add(id));
      return next;
    });

    showToast(
      "Contacts added to audience",
      `Added ${idsToAdd.length} contact${idsToAdd.length === 1 ? "" : "s"} to audience.`,
    );
  }

  async function handleClearSelection() {
    if (selectedCustomerIds.size === 0) {
      showToast("Audience unchanged", "No contacts are currently selected.", "info");
      return;
    }

    setBusy(true);

    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/campaigns/recipients",
      { method: "DELETE", body: { campaignId } },
    );

    setBusy(false);

    if (error) {
      showToast("Could not clear audience", error, "error");
      return;
    }

    setSelectedCustomerIds(new Set());
    setClearDialogOpen(false);
    showToast("Audience cleared", "All contacts removed from audience.");
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

          <AlertDialog.Root
            open={clearDialogOpen}
            onOpenChange={setClearDialogOpen}
          >
            <AlertDialog.Trigger
              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
              disabled={busy || selectedCustomerIds.size === 0}
              type="button"
            >
              <Trash2 className="size-3.5" />
              Clear
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Backdrop className="fixed inset-0 z-[110] bg-slate-950/40 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
              <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-[111] flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 text-slate-950 shadow-xl transition duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
                <div>
                  <AlertDialog.Title className="text-[16px] font-bold">
                    Clear campaign audience?
                  </AlertDialog.Title>
                  <AlertDialog.Description className="mt-2 text-[13px] leading-relaxed text-slate-600">
                    This will remove all {selectedCustomerIds.size} selected
                    contact{selectedCustomerIds.size === 1 ? "" : "s"} from
                    this campaign&apos;s audience.
                  </AlertDialog.Description>
                </div>
                <div className="flex justify-end gap-2">
                  <AlertDialog.Close
                    className="rounded-full border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    disabled={busy}
                  >
                    Cancel
                  </AlertDialog.Close>
                  <button
                    className="rounded-full bg-red-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                    disabled={busy}
                    onClick={() => void handleClearSelection()}
                  >
                    {busy ? "Clearing…" : "Clear audience"}
                  </button>
                </div>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
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
            Click a tag to add its contacts; click it again when all are selected to remove them.
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
                  disabled={busy || taggedCustomerIds.length === 0}
                  onClick={() => void handleAddCustomersWithTag(tag.id, tag.name)}
                  aria-label={
                    isAllAdded
                      ? `Remove customers with ${tag.name} tag from audience`
                      : `Add customers with ${tag.name} tag to audience`
                  }
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-medium transition ${
                    isAllAdded
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <span>{tag.name}</span>
                  {isAllAdded ? (
                    <span className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600">
                      <Check className="size-3" /> All in · click to remove
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

    </section>
  );
}
