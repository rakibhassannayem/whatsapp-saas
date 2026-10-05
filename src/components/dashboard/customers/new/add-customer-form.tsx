"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import { Input } from "@/components/ui/input";
import type { Customer } from "@/types/customer";

export default function AddCustomerForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    setMessage("");
    setIsError(false);
    setBusy(true);
    const { error } = await dashboardApiRequest<Customer>(
      "/api/dashboard/customers",
      {
        method: "POST",
        body: { full_name: fullName, phone_e164: phone, email: email || null },
      },
    );
    setBusy(false);
    if (error) {
      setMessage(error);
      setIsError(true);
      return;
    }
    router.replace("/dashboard/customers");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <form className="space-y-4" onSubmit={handleAdd}>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">
            Full name
          </span>
          <Input
            name="fullName"
            maxLength={120}
            placeholder="e.g. Rahim Uddin"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">
            WhatsApp phone
          </span>
          <Input
            name="phone"
            type="tel"
            placeholder="+8801712345678"
            pattern="^\+[1-9][0-9]{1,14}$"
            maxLength={16}
            required
          />
          <span className="mt-1.5 block text-[12px] text-slate-500">
            Include country code, e.g. +8801712345678
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">
            Email (optional)
          </span>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="rahim@example.com"
          />
        </label>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
          >
            <UserPlus className="size-4" />
            {busy ? "Saving..." : "Add customer"}
          </button>
          <Link
            href="/dashboard/customers"
            className="inline-flex items-center rounded-full border border-slate-200 px-5 py-2.5 text-[13px] font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
      {message && (
        <p
          className={
            isError
              ? "mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600"
              : "mt-4 rounded-xl bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-700"
          }
        >
          {message}
        </p>
      )}
    </div>
  );
}
