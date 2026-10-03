"use client";

import { useMemo, useState } from "react";
import { Pencil, Search, Tags as TagsIcon, Trash2 } from "lucide-react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { Customer, CustomerTag, Tag } from "./customer-types";
import CustomerEditForm from "./customer-edit-form";

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
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  function notify(text: string, error = false) {
    setMessage(text);
    setIsError(error);
  }

  async function handleDelete(customer: Customer) {
    const ok = window.confirm(`Remove ${customer.full_name} from the customer list?`);
    if (!ok) return;
    notify("");
    setBusy(true);
    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/customers",
      { method: "DELETE", body: { id: customer.id } }
    );
    setBusy(false);
    if (error) {
      notify(error, true);
      return;
    }
    setCustomers((c) => c.filter((i) => i.id !== customer.id));
    notify("Customer deleted.");
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
      current.filter((i) => !(i.tag_id === tagId && target.has(i.customer_id)))
    );
  }

  async function applyTag(customerIds: string[], tagId: string) {
    if (customerIds.length === 0 || !tagId) return;
    notify("");
    setBusy(true);
    let added = 0;
    let skipped = 0;
    for (const batch of chunkIds(customerIds)) {
      const { data, error } = await dashboardApiRequest<{
        addedCount: number;
        skippedCount: number;
      }>("/api/dashboard/customer-tags", {
        method: "POST",
        body: { tagId, customerIds: batch },
      });
      if (error) {
        setBusy(false);
        notify(error, true);
        return;
      }
      added += data?.addedCount ?? batch.length;
      skipped += data?.skippedCount ?? 0;
    }
    setBusy(false);
    addLocalTag(customerIds, tagId);
    notify(
      skipped > 0
        ? `Tag applied to ${added} customers. ${skipped} already had it.`
        : `Tag applied to ${added} customer${added === 1 ? "" : "s"}.`
    );
  }

  async function removeTag(customerIds: string[], tagId: string) {
    if (customerIds.length === 0 || !tagId) return;
    notify("");
    setBusy(true);
    let removed = 0;
    for (const batch of chunkIds(customerIds)) {
      const { data, error } = await dashboardApiRequest<{ removedCount: number }>(
        "/api/dashboard/customer-tags",
        { method: "DELETE", body: { tagId, customerIds: batch } }
      );
      if (error) {
        setBusy(false);
        notify(error, true);
        return;
      }
      removed += data?.removedCount ?? batch.length;
    }
    setBusy(false);
    removeLocalTag(customerIds, tagId);
    notify(`Tag removed from ${removed} customer${removed === 1 ? "" : "s"}.`);
  }

  async function handleAddTag(customerId: string, tagId: string) {
    await applyTag([customerId], tagId);
  }

  async function handleRemoveTag(customerId: string, tagId: string) {
    await removeTag([customerId], tagId);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.phone_e164.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false)
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
            <p className="text-[14px] font-bold text-slate-900">No customers found</p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">
              Add your first customer or import your Excel list to start broadcasting.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((customer) => (
              <li
                key={customer.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                {editingCustomer?.id === customer.id ? (
                  <CustomerEditForm
                    customer={editingCustomer}
                    busy={busy}
                    setBusy={setBusy}
                    onCancel={() => setEditingCustomer(null)}
                    onSaved={(c) => {
                      setCustomers((list) => list.map((i) => (i.id === c.id ? c : i)));
                      setEditingCustomer(null);
                      notify("Customer updated.");
                    }}
                    onError={(t) => notify(t, true)}
                  />
                ) : (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-bold text-slate-950">{customer.full_name}</h3>
                        <p className="mt-0.5 text-[13px] text-slate-500">{customer.phone_e164}{customer.email ? ` • ${customer.email}` : ""}</p>
                      </div>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => setEditingCustomer(customer)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-[12px] font-bold text-slate-600 transition hover:bg-slate-50">
                        <Pencil className="size-3.5" /> Edit
                      </button>
                      <button type="button" disabled={busy} onClick={() => handleDelete(customer)} className="inline-flex items-center gap-1.5 rounded-full border border-red-100 px-3.5 py-1.5 text-[12px] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50">
                        <Trash2 className="size-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div>
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      <TagsIcon className="size-3.5" /> Tags
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {customerTags.filter((i) => i.customer_id === customer.id).map((item) => {
                        const tag = initialTags.find((t) => t.id === item.tag_id);
                        if (!tag) return null;
                        return (
                          <Badge key={item.tag_id} variant="secondary" className="gap-1.5 rounded-full bg-emerald-50 py-1 pl-3 pr-1.5 text-emerald-800">
                            {tag.name}
                            <button type="button" disabled={busy} aria-label={`Remove ${tag.name} tag`} onClick={() => handleRemoveTag(customer.id, tag.id)} className="flex size-4 items-center justify-center rounded-full text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50">×</button>
                          </Badge>
                        );
                      })}
                    </div>
                    {initialTags.length === 0 ? (
                      <p className="mt-2 text-[12px] text-slate-500">Create a tag on the Tags page first.</p>
                    ) : (
                      <select className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:w-56" value="" disabled={busy} aria-label={`Add a tag for ${customer.full_name}`} onChange={(e) => { if (e.target.value) void handleAddTag(customer.id, e.target.value); }}>
                        <option value="">Add a tag…</option>
                        {initialTags.filter((tag) => !customerTags.some((i) => i.customer_id === customer.id && i.tag_id === tag.id)).map((tag) => (
                          <option key={tag.id} value={tag.id}>{tag.name}</option>
                        ))}
                      </select>
                    )}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {message && (
        <p className={isError ? "mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600" : "mt-4 rounded-xl bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-700"}>
          {message}
        </p>
      )}
    </>
  );
}
