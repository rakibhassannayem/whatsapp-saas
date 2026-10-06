"use client";

import { Pencil, Tags as TagsIcon, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { showToast } from "@/components/ui/toast";
import type { Customer, CustomerTag, Tag } from "@/types/customer";
import CustomerEditForm from "./customer-edit-form";

interface CustomerListItemProps {
  customer: Customer;
  isEditing: boolean;
  initialTags: Tag[];
  customerTags: CustomerTag[];
  busy: boolean;
  setBusy: (busy: boolean) => void;
  onStartEdit: (customer: Customer) => void;
  onCancelEdit: () => void;
  onSaved: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onAddTag: (customerId: string, tagId: string) => void;
  onRemoveTag: (customerId: string, tagId: string) => void;
}

export default function CustomerListItem({
  customer,
  isEditing,
  initialTags,
  customerTags,
  busy,
  setBusy,
  onStartEdit,
  onCancelEdit,
  onSaved,
  onDelete,
  onAddTag,
  onRemoveTag,
}: CustomerListItemProps) {
  if (isEditing) {
    return (
      <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <CustomerEditForm
          customer={customer}
          busy={busy}
          setBusy={setBusy}
          onCancel={onCancelEdit}
          onSaved={(c) => {
            onSaved(c);
            showToast("Customer updated", `${c.full_name} was saved.`);
          }}
          onError={(error) =>
            showToast("Could not update customer", error, "error")
          }
        />
      </li>
    );
  }

  const assignedCustomerTags = customerTags.filter(
    (i) => i.customer_id === customer.id,
  );
  const unassignedTags = initialTags.filter(
    (tag) => !customerTags.some((i) => i.customer_id === customer.id && i.tag_id === tag.id),
  );

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-bold text-slate-950">
            {customer.full_name}
          </h3>
          <p className="mt-0.5 text-[13px] text-slate-500">
            {customer.phone_e164}
            {customer.email ? ` • ${customer.email}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onStartEdit(customer)}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-[12px] font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <Pencil className="size-3.5" /> Edit
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDelete(customer)}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-100 px-3.5 py-1.5 text-[12px] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
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
          {assignedCustomerTags.map((item) => {
            const tag = initialTags.find((t) => t.id === item.tag_id);
            if (!tag) return null;
            return (
              <Badge
                key={item.tag_id}
                variant="secondary"
                className="gap-1.5 rounded-full bg-emerald-50 py-1 pl-3 pr-1.5 text-emerald-800"
              >
                {tag.name}
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`Remove ${tag.name} tag`}
                  onClick={() => onRemoveTag(customer.id, tag.id)}
                  className="flex size-4 items-center justify-center rounded-full text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50"
                >
                  ×
                </button>
              </Badge>
            );
          })}
        </div>

        {initialTags.length === 0 ? (
          <p className="mt-2 text-[12px] text-slate-500">
            Create a tag on the Tags page first.
          </p>
        ) : (
          <select
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:w-56"
            value=""
            disabled={busy}
            aria-label={`Add a tag for ${customer.full_name}`}
            onChange={(e) => {
              if (e.target.value) onAddTag(customer.id, e.target.value);
            }}
          >
            <option value="">Add a tag…</option>
            {unassignedTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </li>
  );
}
