"use client";

import { useState } from "react";
import { AlertCircle, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/components/ui/toast";
import type { Customer, CustomerTag, Tag } from "@/types/customer";
import InstantAudiencePicker from "./instant-audience-picker";

interface InstantMessageTabProps {
  customers: Customer[];
  initialTags: Tag[];
  initialCustomerTags: CustomerTag[];
}

export default function InstantMessageTab({
  customers,
  initialTags,
  initialCustomerTags,
}: InstantMessageTabProps) {
  const [instantMessage, setInstantMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  function handleToggleTag(tagName: string, customerIds: string[]) {
    const allSelected =
      customerIds.length > 0 &&
      customerIds.every((customerId) => selectedIds.has(customerId));

    setSelectedIds((current) => {
      const next = new Set(current);
      customerIds.forEach((customerId) => {
        if (allSelected) {
          next.delete(customerId);
        } else {
          next.add(customerId);
        }
      });
      return next;
    });

    showToast(
      allSelected ? "Customers removed from audience" : "Customers added to audience",
      allSelected
        ? `Removed customers tagged "${tagName}" from the instant-message audience.`
        : `Added customers tagged "${tagName}" to the instant-message audience.`,
    );
  }

  function handleToggleCustomer(customerId: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(customerId);
      } else {
        next.delete(customerId);
      }
      return next;
    });
  }

  function handleSelectAllFiltered(filteredIds: string[]) {
    setSelectedIds((current) => {
      const next = new Set(current);
      filteredIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function handleClearSelection() {
    setSelectedIds(new Set());
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Send className="size-4 text-emerald-600" />
        <h2 className="text-[15px] font-bold text-slate-950">Instant Message</h2>
      </div>
      <p className="mt-1 text-[13px] text-slate-500">
        Compose and preview an ad-hoc message. (Live WhatsApp delivery is being connected)
      </p>

      <InstantAudiencePicker
        customers={customers}
        initialTags={initialTags}
        initialCustomerTags={initialCustomerTags}
        selectedIds={selectedIds}
        onToggleCustomer={handleToggleCustomer}
        onSelectAllFiltered={handleSelectAllFiltered}
        onClearSelection={handleClearSelection}
        onToggleTag={handleToggleTag}
      />

      <div className="mt-4">
        <label
          className="mb-1 block text-[13px] font-semibold text-slate-700"
          htmlFor="instant-message"
        >
          Message text
        </label>
        <Textarea
          className="min-h-36 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[13px] focus:bg-white focus:ring-emerald-200"
          id="instant-message"
          placeholder="Hi there, thanks for reaching out! Here's a quick update..."
          value={instantMessage}
          onChange={(event) => setInstantMessage(event.target.value)}
        />
        <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
          <span>Standard WhatsApp markdown supported (*bold*, _italic_)</span>
          <span>{instantMessage.length} characters</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 text-[12px] text-amber-600">
          <AlertCircle className="size-4 shrink-0" />
          <span>Direct delivery requires WhatsApp Cloud API connection.</span>
        </div>

        <button
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-[13px] font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled
          title="Message sending will be enabled once WhatsApp Cloud API keys are connected."
        >
          <Send className="size-3.5" />
          Send instant message
        </button>
      </div>
    </section>
  );
}
