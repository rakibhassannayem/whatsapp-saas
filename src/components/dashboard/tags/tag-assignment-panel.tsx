"use client";

import { useMemo, useState } from "react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import { showToast } from "@/components/ui/toast";
import type { Customer, CustomerTag, Tag } from "@/types/customer";

const MAX_CUSTOMERS_PER_REQUEST = 1000;

function chunkIds(ids: string[]): string[][] {
  const batches: string[][] = [];
  for (let index = 0; index < ids.length; index += MAX_CUSTOMERS_PER_REQUEST) {
    batches.push(ids.slice(index, index + MAX_CUSTOMERS_PER_REQUEST));
  }
  return batches;
}

interface TagAssignmentPanelProps {
  tags: Tag[];
  initialCustomers: Customer[];
  customerTags: CustomerTag[];
  setCustomerTags: React.Dispatch<React.SetStateAction<CustomerTag[]>>;
  selectedTagId: string;
  setSelectedTagId: (id: string) => void;
  busy: boolean;
  setBusy: (busy: boolean) => void;
}

export default function TagAssignmentPanel({
  tags,
  initialCustomers,
  customerTags,
  setCustomerTags,
  selectedTagId,
  setSelectedTagId,
  busy,
  setBusy,
}: TagAssignmentPanelProps) {
  const [showAssignment, setShowAssignment] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(
    () => new Set(),
  );

  const taggedCustomerIds = useMemo(
    () =>
      new Set(
        customerTags
          .filter((item) => item.tag_id === selectedTagId)
          .map((item) => item.customer_id),
      ),
    [customerTags, selectedTagId],
  );

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return initialCustomers;
    return initialCustomers.filter(
      (customer) =>
        customer.full_name.toLowerCase().includes(query) ||
        customer.phone_e164.toLowerCase().includes(query) ||
        (customer.email?.toLowerCase().includes(query) ?? false),
    );
  }, [customerSearch, initialCustomers]);

  const availableCustomerCount = initialCustomers.filter(
    (customer) => !taggedCustomerIds.has(customer.id),
  ).length;

  function handleToggleCustomer(customerId: string, shouldSelect: boolean) {
    setSelectedCustomerIds((current) => {
      const next = new Set(current);
      if (shouldSelect) {
        next.add(customerId);
      } else {
        next.delete(customerId);
      }
      return next;
    });
  }

  async function handleApplyTag() {
    if (!selectedTagId || selectedCustomerIds.size === 0) return;

    setBusy(true);
    let addedCount = 0;
    let skippedCount = 0;
    const customerIds = [...selectedCustomerIds];

    for (const batch of chunkIds(customerIds)) {
      const { data, error } = await dashboardApiRequest<{
        addedCount: number;
        skippedCount: number;
      }>("/api/dashboard/customers/tags", {
        method: "POST",
        body: { tagId: selectedTagId, customerIds: batch },
      });

      if (error) {
        setBusy(false);
        showToast(
          "Could not apply tag",
          addedCount > 0
            ? `Tag applied to ${addedCount} customers before an error: ${error}`
            : error,
          "error",
        );
        return;
      }

      addedCount += data?.addedCount ?? batch.length;
      skippedCount += data?.skippedCount ?? 0;
      setCustomerTags((current) => {
        const existingIds = new Set(
          current
            .filter((item) => item.tag_id === selectedTagId)
            .map((item) => item.customer_id),
        );
        return [
          ...current,
          ...batch
            .filter((customerId) => !existingIds.has(customerId))
            .map((customerId) => ({
              customer_id: customerId,
              tag_id: selectedTagId,
            })),
        ];
      });
      setSelectedCustomerIds((current) => {
        const next = new Set(current);
        batch.forEach((customerId) => next.delete(customerId));
        return next;
      });
    }

    setBusy(false);
    showToast(
      "Tag applied",
      skippedCount > 0
        ? `Tag applied to ${addedCount} customers. ${skippedCount} already had it.`
        : `Tag applied to ${addedCount} customer${addedCount === 1 ? "" : "s"}.`,
    );
  }

  async function handleRemoveTag(customerId: string) {
    if (!selectedTagId) return;

    setBusy(true);

    const { data, error } = await dashboardApiRequest<{
      removedCount: number;
    }>("/api/dashboard/customers/tags", {
      method: "DELETE",
      body: { tagId: selectedTagId, customerId },
    });

    setBusy(false);

    if (error) {
      showToast("Could not remove tag", error, "error");
      return;
    }

    if (!data) {
      showToast(
        "Could not confirm tag removal",
        "Could not confirm tag removal. Refresh to check the assignment.",
        "error",
      );
      return;
    }

    setCustomerTags((current) =>
      current.filter(
        (item) =>
          item.tag_id !== selectedTagId || item.customer_id !== customerId,
      ),
    );
    showToast(
      data.removedCount > 0 ? "Tag removed" : "Assignment already removed",
      data.removedCount > 0
        ? "Tag removed from customer."
        : "This customer no longer had this tag.",
    );
  }

  return (
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-bold text-slate-950">
            Manage Customers for a Tag
          </h2>
          <p className="mt-1 text-[13px] text-slate-500">
            Pick a tag to assign it to customers or remove it from customers
            who already have it.
          </p>
        </div>
        <button
          className="shrink-0 rounded-full border border-slate-200 px-4 py-2 text-[12px] font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          type="button"
          onClick={() => setShowAssignment((current) => !current)}
          disabled={tags.length === 0 || initialCustomers.length === 0}
          aria-expanded={showAssignment}
        >
          {showAssignment ? "Close" : "Manage customers"}
        </button>
      </div>

      {tags.length === 0 && (
        <p className="mt-3 text-[13px] text-slate-500">
          Create a tag first before assigning customers.
        </p>
      )}
      {initialCustomers.length === 0 && tags.length > 0 && (
        <p className="mt-3 text-[13px] text-slate-500">
          Add or import customers first so you can assign tags.
        </p>
      )}

      {showAssignment && tags.length > 0 && initialCustomers.length > 0 && (
        <div className="mt-5 border-t pt-5">
          <label
            className="block text-sm font-medium"
            htmlFor="assignment-tag"
          >
            Choose tag
          </label>
          <select
            className="mt-2 w-full rounded-md border bg-white p-2 sm:max-w-sm"
            id="assignment-tag"
            value={selectedTagId}
            disabled={busy}
            onChange={(event) => {
              setSelectedTagId(event.target.value);
              setSelectedCustomerIds(new Set());
            }}
          >
            <option value="">Select a tag</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>

          {selectedTagId && (
            <>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-600">
                  {selectedCustomerIds.size} selected ·{" "}
                  {availableCustomerCount} not yet tagged
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                    type="button"
                    disabled={busy || availableCustomerCount === 0}
                    onClick={() =>
                      setSelectedCustomerIds(
                        new Set(
                          initialCustomers
                            .filter(
                              (customer) =>
                                !taggedCustomerIds.has(customer.id),
                            )
                            .map((customer) => customer.id),
                        ),
                      )
                    }
                  >
                    Select all available
                  </button>
                  <button
                    className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                    type="button"
                    disabled={busy || selectedCustomerIds.size === 0}
                    onClick={() => setSelectedCustomerIds(new Set())}
                  >
                    Clear selection
                  </button>
                </div>
              </div>

              <label className="sr-only" htmlFor="customer-search">
                Search customers
              </label>
              <input
                className="mt-4 w-full rounded-md border p-2"
                id="customer-search"
                placeholder="Search name, phone, or email"
                value={customerSearch}
                onChange={(event) => setCustomerSearch(event.target.value)}
              />

              <ul className="mt-3 max-h-96 divide-y overflow-y-auto rounded-md border">
                {filteredCustomers.map((customer) => {
                  const alreadyTagged = taggedCustomerIds.has(customer.id);
                  const checked =
                    alreadyTagged || selectedCustomerIds.has(customer.id);

                  return (
                    <li
                      className="flex items-center justify-between gap-3 p-3"
                      key={customer.id}
                    >
                      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                        <input
                          className="mt-1 size-4"
                          type="checkbox"
                          checked={checked}
                          disabled={busy || alreadyTagged}
                          onChange={(event) =>
                            handleToggleCustomer(
                              customer.id,
                              event.target.checked,
                            )
                          }
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {customer.full_name}
                            {alreadyTagged && (
                              <span className="ml-2 text-xs font-normal text-gray-500">
                                Already tagged
                              </span>
                            )}
                          </span>
                          <span className="block truncate text-xs text-gray-600">
                            {customer.phone_e164}
                            {customer.email ? ` · ${customer.email}` : ""}
                          </span>
                        </span>
                      </label>
                      {alreadyTagged && (
                        <button
                          className="shrink-0 rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                          type="button"
                          onClick={() => void handleRemoveTag(customer.id)}
                          disabled={busy}
                          aria-label={`Remove tag from ${customer.full_name}`}
                        >
                          Remove tag
                        </button>
                      )}
                    </li>
                  );
                })}
                {filteredCustomers.length === 0 && (
                  <li className="p-4 text-sm text-gray-600">
                    No customers match your search.
                  </li>
                )}
              </ul>

              <button
                className="mt-4 rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
                type="button"
                disabled={busy || selectedCustomerIds.size === 0}
                onClick={() => void handleApplyTag()}
              >
                {busy
                  ? "Applying..."
                  : `Apply tag to ${selectedCustomerIds.size} selected`}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
