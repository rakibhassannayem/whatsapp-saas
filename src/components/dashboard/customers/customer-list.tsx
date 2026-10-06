"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast";
import type { Customer, CustomerTag, Tag } from "@/types/customer";
import CustomerListItem from "./customer-list-item";

const MAX_IDS_PER_REQUEST = 1000;

function chunkIds(ids: string[]): string[][] {
  if (ids.length <= MAX_IDS_PER_REQUEST) return [ids];
  const batches: string[][] = [];
  for (let index = 0; index < ids.length; index += MAX_IDS_PER_REQUEST) {
    batches.push(ids.slice(index, index + MAX_IDS_PER_REQUEST));
  }
  return batches;
}

export default function CustomerList({
  initialCustomers,
  initialTags,
  initialCustomerTags,
}: {
  initialCustomers: Customer[];
  initialTags: Tag[];
  initialCustomerTags: CustomerTag[];
}) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [customerTags, setCustomerTags] = useState(initialCustomerTags);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  async function handleDelete(customer: Customer) {
    const ok = window.confirm(
      `Remove ${customer.full_name} from the customer list?`,
    );
    if (!ok) return;
    setBusy(true);
    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/customers",
      { method: "DELETE", body: { id: customer.id } },
    );
    setBusy(false);
    if (error) {
      showToast("Could not delete customer", error, "error");
      return;
    }
    setCustomers((c) => c.filter((i) => i.id !== customer.id));
    showToast("Customer deleted", `${customer.full_name} was removed.`);
  }

  function addLocalTag(customerIds: string[], tagId: string) {
    setCustomerTags((current) => {
      const keys = new Set(current.map((i) => `${i.customer_id}:${i.tag_id}`));
      const next = [...current];
      customerIds.forEach((customerId) => {
        const key = `${customerId}:${tagId}`;
        if (!keys.has(key)) {
          next.push({ customer_id: customerId, tag_id: tagId });
          keys.add(key);
        }
      });
      return next;
    });
  }

  function removeLocalTag(customerIds: string[], tagId: string) {
    const target = new Set(customerIds);
    setCustomerTags((current) =>
      current.filter((i) => !(i.tag_id === tagId && target.has(i.customer_id))),
    );
  }

  async function applyTag(customerIds: string[], tagId: string) {
    if (customerIds.length === 0 || !tagId) return;
    setBusy(true);
    let added = 0;
    let skipped = 0;
    for (const batch of chunkIds(customerIds)) {
      const { data, error } = await dashboardApiRequest<{
        addedCount: number;
        skippedCount: number;
      }>("/api/dashboard/customers/tags", {
        method: "POST",
        body: { tagId, customerIds: batch },
      });
      if (error) {
        setBusy(false);
        showToast("Could not apply tag", error, "error");
        return;
      }
      added += data?.addedCount ?? batch.length;
      skipped += data?.skippedCount ?? 0;
    }
    setBusy(false);
    addLocalTag(customerIds, tagId);
    showToast(
      "Tag applied",
      skipped > 0
        ? `Tag applied to ${added} customers. ${skipped} already had it.`
        : `Tag applied to ${added} customer${added === 1 ? "" : "s"}.`,
    );
  }

  async function removeTag(customerIds: string[], tagId: string) {
    if (customerIds.length === 0 || !tagId) return;
    setBusy(true);
    let removed = 0;
    for (const batch of chunkIds(customerIds)) {
      const { data, error } = await dashboardApiRequest<{
        removedCount: number;
      }>("/api/dashboard/customers/tags", {
        method: "DELETE",
        body: { tagId, customerIds: batch },
      });
      if (error) {
        setBusy(false);
        showToast("Could not remove tag", error, "error");
        return;
      }
      removed += data?.removedCount ?? batch.length;
    }
    setBusy(false);
    removeLocalTag(customerIds, tagId);
    showToast(
      "Tag removed",
      `Tag removed from ${removed} customer${removed === 1 ? "" : "s"}.`,
    );
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.phone_e164.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false),
    );
  }, [customers, search]);

  return (
    <>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="rounded-xl border-slate-200 bg-white py-2.5 pl-10"
              placeholder="Search name, phone, or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search customers"
            />
          </div>
        </div>
      </div>
      <section className="mt-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-[14px] font-bold text-slate-900">
              No customers found
            </p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">
              Add your first customer or import your Excel list to start
              broadcasting.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((customer) => (
              <CustomerListItem
                key={customer.id}
                customer={customer}
                isEditing={editingCustomerId === customer.id}
                initialTags={initialTags}
                customerTags={customerTags}
                busy={busy}
                setBusy={setBusy}
                onStartEdit={(c) => setEditingCustomerId(c.id)}
                onCancelEdit={() => setEditingCustomerId(null)}
                onSaved={(c) => {
                  setCustomers((list) =>
                    list.map((i) => (i.id === c.id ? c : i)),
                  );
                  setEditingCustomerId(null);
                }}
                onDelete={handleDelete}
                onAddTag={(cId, tId) => void applyTag([cId], tId)}
                onRemoveTag={(cId, tId) => void removeTag([cId], tId)}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
