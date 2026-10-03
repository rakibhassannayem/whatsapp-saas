"use client";

import { type FormEvent } from "react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import { Input } from "@/components/ui/input";
import type { Customer } from "./customer-types";

export default function CustomerEditForm({
  customer,
  busy,
  setBusy,
  onCancel,
  onSaved,
  onError,
}: {
  customer: Customer;
  busy: boolean;
  setBusy: (v: boolean) => void;
  onCancel: () => void;
  onSaved: (c: Customer) => void;
  onError: (text: string) => void;
}) {
  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    onError("");
    setBusy(true);
    const { data, error } = await dashboardApiRequest<Customer>("/api/dashboard/customers", {
      method: "PATCH",
      body: { id: customer.id, full_name: fullName, phone_e164: phone, email: email || null },
    });
    setBusy(false);
    if (error || !data) {
      onError(error ?? "Could not update customer.");
      return;
    }
    onSaved(data);
  }

  return (
    <form className="space-y-3" onSubmit={handleUpdate}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-slate-600">Full name</span>
          <Input name="fullName" defaultValue={customer.full_name} maxLength={120} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-slate-600">WhatsApp phone</span>
          <Input
            name="phone"
            type="tel"
            defaultValue={customer.phone_e164}
            pattern="^\+[1-9][0-9]{1,14}$"
            maxLength={16}
            required
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-slate-600">Email (optional)</span>
        <Input name="email" type="email" defaultValue={customer.email ?? ""} />
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-emerald-500 px-4 py-2 text-[12px] font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
        >
          {busy ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate-200 px-4 py-2 text-[12px] font-bold text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
