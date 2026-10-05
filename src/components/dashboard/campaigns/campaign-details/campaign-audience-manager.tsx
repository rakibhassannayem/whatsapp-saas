"use client";

import { useState } from "react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import type {
  CampaignAudienceManagerProps,
  CampaignRecipient,
} from "@/types/campaign";
import type { Customer, CustomerTag, Tag } from "@/types/customer";

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
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleToggleCustomer(
    customerId: string,
    shouldSelect: boolean,
  ) {
    setMessage("");
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
      setMessage(error);
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

    setMessage(
      shouldSelect
        ? "Customer audience-এ যোগ হয়েছে।"
        : "Customer audience থেকে সরানো হয়েছে।",
    );
  }

  async function handleAddCustomersWithTag(tagId: string) {
    const taggedCustomerIds = initialCustomerTags
      .filter((item) => item.tag_id === tagId)
      .map((item) => item.customer_id);

    const customerIdsToAdd = taggedCustomerIds.filter(
      (customerId) => !selectedCustomerIds.has(customerId),
    );

    if (customerIdsToAdd.length === 0) {
      setMessage(
        taggedCustomerIds.length === 0
          ? "এই tag-এ কোনো customer নেই।"
          : "এই tag-এর সব customer ইতিমধ্যে selected।",
      );
      return;
    }

    setMessage("");
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
      setMessage(error);
      return;
    }

    setSelectedCustomerIds((current) => {
      const next = new Set(current);
      customerIdsToAdd.forEach((customerId) => next.add(customerId));
      return next;
    });

    setMessage(`${customerIdsToAdd.length} জন customer audience-এ যোগ হয়েছে।`);
  }

  async function handleSelectAll() {
    const unselectedCustomers = initialCustomers.filter(
      (customer) => !selectedCustomerIds.has(customer.id),
    );

    if (unselectedCustomers.length === 0) {
      setMessage("সব customer ইতিমধ্যে selected।");
      return;
    }

    setMessage("");
    setBusy(true);

    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/campaigns/recipients",
      {
        method: "POST",
        body: {
          campaignId,
          customerIds: unselectedCustomers.map((customer) => customer.id),
        },
      },
    );

    setBusy(false);

    if (error) {
      setMessage(error);
      return;
    }

    setSelectedCustomerIds(
      new Set(initialCustomers.map((customer) => customer.id)),
    );
    setMessage("সব customer audience-এ যোগ হয়েছে।");
  }

  async function handleClearSelection() {
    if (selectedCustomerIds.size === 0) {
      setMessage("কোনো customer selected নেই।");
      return;
    }

    const confirmed = window.confirm(
      "এই campaign থেকে সব selected customer সরাবে?",
    );

    if (!confirmed) return;

    setMessage("");
    setBusy(true);

    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/campaigns/recipients",
      { method: "DELETE", body: { campaignId } },
    );

    setBusy(false);

    if (error) {
      setMessage(error);
      return;
    }

    setSelectedCustomerIds(new Set());
    setMessage("সব customer audience থেকে সরানো হয়েছে।");
  }

  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Campaign audience</h2>
          <p className="text-sm text-gray-600">
            যেসব customer এই campaign-এর audience-এ থাকবে, তাদের বেছে নাও।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
            {selectedCustomerIds.size} selected
          </span>

          <button
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            type="button"
            disabled={busy || initialCustomers.length === 0}
            onClick={() => void handleSelectAll()}
          >
            Select all
          </button>

          <button
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            type="button"
            disabled={busy || selectedCustomerIds.size === 0}
            onClick={() => void handleClearSelection()}
          >
            Clear selection
          </button>
        </div>
      </div>

      {initialTags.length > 0 && (
        <section className="mb-5 rounded-lg border bg-white p-4">
          <h3 className="font-medium">Tag দিয়ে customer যোগ করো</h3>
          <ul className="mt-3 space-y-2">
            {initialTags.map((tag) => {
              const taggedCustomerIds = initialCustomerTags
                .filter((item) => item.tag_id === tag.id)
                .map((item) => item.customer_id);

              const availableCount = taggedCustomerIds.filter(
                (customerId) => !selectedCustomerIds.has(customerId),
              ).length;

              return (
                <li
                  className="flex flex-wrap items-center justify-between gap-3 border-t pt-3"
                  key={tag.id}
                >
                  <span>
                    {tag.name}
                    <span className="ml-2 text-sm text-gray-600">
                      ({availableCount} জন এখনও যোগ হয়নি)
                    </span>
                  </span>

                  <button
                    className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                    type="button"
                    disabled={busy || availableCount === 0}
                    onClick={() => void handleAddCustomersWithTag(tag.id)}
                  >
                    Add customers
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {initialCustomers.length === 0 ? (
        <p className="rounded-lg border bg-white p-4 text-gray-600">
          এখনো কোনো customer নেই। আগে Customers পেজে customer যোগ বা import করো।
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-white">
          {initialCustomers.map((customer) => {
            const selected = selectedCustomerIds.has(customer.id);

            return (
              <li className="p-4" key={customer.id}>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    className="mt-1 size-4"
                    type="checkbox"
                    checked={selected}
                    disabled={busy}
                    onChange={(event) =>
                      void handleToggleCustomer(
                        customer.id,
                        event.currentTarget.checked,
                      )
                    }
                  />

                  <span>
                    <span className="block font-medium">
                      {customer.full_name}
                    </span>
                    <span className="mt-1 block text-sm text-gray-600">
                      {customer.phone_e164}
                    </span>
                    {customer.email && (
                      <span className="block text-sm text-gray-600">
                        {customer.email}
                      </span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {message && (
        <p
          className="mt-4 rounded-md border bg-white p-3 text-sm"
          role="status"
        >
          {message}
        </p>
      )}
    </section>
  );
}
