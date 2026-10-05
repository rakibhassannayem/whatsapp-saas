"use client";

import { useMemo, useState, type FormEvent } from "react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import type { Tag, TagsManagerProps } from "@/types/customer";

const MAX_CUSTOMERS_PER_REQUEST = 1000;

function chunkIds(ids: string[]): string[][] {
  const batches: string[][] = [];
  for (let index = 0; index < ids.length; index += MAX_CUSTOMERS_PER_REQUEST) {
    batches.push(ids.slice(index, index + MAX_CUSTOMERS_PER_REQUEST));
  }
  return batches;
}

export default function TagsManager({
  initialTags,
  initialCustomers,
  initialCustomerTags,
}: TagsManagerProps) {
  const [tags, setTags] = useState(initialTags);
  const [customerTags, setCustomerTags] = useState(initialCustomerTags);
  const [selectedTagId, setSelectedTagId] = useState("");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [showAssignment, setShowAssignment] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

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

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();

    setMessage("");
    setBusy(true);

    const { data, error } = await dashboardApiRequest<Tag>(
      "/api/dashboard/tags",
      { method: "POST", body: { name } },
    );

    setBusy(false);

    if (error || !data) {
      setMessage(error ?? "Tag তৈরি করা যায়নি।");
      return;
    }

    setTags((current) =>
      [...current, data].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setMessage("Tag তৈরি হয়েছে।");
    form.reset();
  }

  async function handleDelete(tag: Tag) {
    const confirmed = window.confirm(
      `Delete the tag "${tag.name}"? This will also remove it from all customers.`,
    );

    if (!confirmed) return;

    setMessage("");
    setBusy(true);

    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/tags",
      { method: "DELETE", body: { id: tag.id } },
    );

    setBusy(false);

    if (error) {
      setMessage(error);
      return;
    }

    setTags((current) => current.filter((item) => item.id !== tag.id));
    if (selectedTagId === tag.id) {
      setSelectedTagId("");
      setSelectedCustomerIds(new Set());
    }
    setMessage("Tag delete হয়েছে।");
  }

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

    setMessage("");
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
        setMessage(
          addedCount > 0
            ? `Tag applied to ${addedCount} customers before an error: ${error}`
            : error,
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
    setMessage(
      skippedCount > 0
        ? `Tag applied to ${addedCount} customers. ${skippedCount} already had it.`
        : `Tag applied to ${addedCount} customer${addedCount === 1 ? "" : "s"}.`,
    );
  }

  return (
    <>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-[15px] font-bold text-slate-950">Create a New Tag</h2>
        <p className="mt-1 text-[13px] text-slate-500">
          Use tags to group customers — for example &quot;VIP&quot;, &quot;New Customer&quot;, or &quot;Inactive&quot;.
        </p>

        <form
          className="mt-5 flex flex-col gap-3 sm:flex-row"
          onSubmit={handleCreate}
        >
          <label className="sr-only" htmlFor="tag-name">
            Tag name
          </label>
          <input
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[13px] outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            id="tag-name"
            name="name"
            placeholder="e.g. VIP, New Customer"
            maxLength={50}
            required
          />

          <button
            className="rounded-full bg-emerald-500 px-5 py-2 text-[13px] font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
            type="submit"
            disabled={busy}
          >
            {busy ? "Saving…" : "Create tag"}
          </button>
        </form>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-slate-950">Assign Customers to a Tag</h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Pick a tag, then select which customers should belong to it.
            </p>
          </div>
          <button
            className="shrink-0 rounded-full border border-slate-200 px-4 py-2 text-[12px] font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            type="button"
            onClick={() => setShowAssignment((current) => !current)}
            disabled={tags.length === 0 || initialCustomers.length === 0}
            aria-expanded={showAssignment}
          >
            {showAssignment ? "Close" : "Assign customers"}
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
                setMessage("");
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
                      <li className="p-3" key={customer.id}>
                        <label className="flex cursor-pointer items-start gap-3">
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

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">তোমার tags</h2>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
            {tags.length}
          </span>
        </div>

        {tags.length === 0 ? (
          <p className="rounded-xl border bg-white p-5 text-gray-600">
            এখনো কোনো tag তৈরি করা হয়নি। উপরের form দিয়ে প্রথম tag তৈরি করো।
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <li
                className="flex items-center justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm"
                key={tag.id}
              >
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
                  {tag.name}
                </span>

                <button
                  className="rounded-md border border-red-200 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                  type="button"
                  onClick={() => handleDelete(tag)}
                  disabled={busy}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {message && (
        <p
          className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-700"
          role="status"
        >
          {message}
        </p>
      )}
    </>
  );
}
