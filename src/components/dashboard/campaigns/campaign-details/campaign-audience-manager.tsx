"use client";

import { useMemo, useState } from "react";
import { CheckCheck, Users } from "lucide-react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import { showToast } from "@/components/ui/toast";
import type { CampaignAudienceManagerProps } from "@/types/campaign";
import ClearAudienceDialog from "./clear-audience-dialog";
import AudienceTagFilter from "./audience-tag-filter";
import AudienceCustomerList from "./audience-customer-list";

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
      allTaggedCustomersSelected
        ? "Customers removed from audience"
        : "Customers added to audience",
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

          <ClearAudienceDialog
            open={clearDialogOpen}
            onOpenChange={setClearDialogOpen}
            selectedCount={selectedCustomerIds.size}
            busy={busy}
            onConfirmClear={() => void handleClearSelection()}
          />
        </div>
      </div>

      <AudienceTagFilter
        initialTags={initialTags}
        initialCustomerTags={initialCustomerTags}
        selectedCustomerIds={selectedCustomerIds}
        busy={busy}
        onToggleTag={handleAddCustomersWithTag}
      />

      <AudienceCustomerList
        initialCustomers={initialCustomers}
        filteredCustomers={filteredCustomers}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCustomerIds={selectedCustomerIds}
        tagsByCustomerId={tagsByCustomerId}
        busy={busy}
        onToggleCustomer={handleToggleCustomer}
      />
    </section>
  );
}
