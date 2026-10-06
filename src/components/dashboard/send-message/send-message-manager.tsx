"use client";

import { useState } from "react";
import { Megaphone, Sparkles } from "lucide-react";
import type { SendMessageManagerProps } from "@/types/campaign";
import type { Customer } from "@/types/customer";
import InstantMessageTab from "./instant-message-tab";
import CampaignMessageTab from "./campaign-message-tab";

export default function SendMessageManager({
  initialCampaigns,
  initialCustomers,
  initialRecipients,
  initialTags,
  initialCustomerTags,
}: SendMessageManagerProps) {
  const [activeTab, setActiveTab] = useState<"campaign" | "instant">("campaign");
  const [customers, setCustomers] = useState(initialCustomers);
  const [recipients, setRecipients] = useState(initialRecipients);

  function handleRecipientsUpdated(
    importedCustomers: Customer[],
    selectedCampaignId: string,
  ) {
    setCustomers((current) => {
      const customersById = new Map(current.map((c) => [c.id, c]));
      importedCustomers.forEach((c) => customersById.set(c.id, c));
      return [...customersById.values()].sort((left, right) =>
        left.full_name.localeCompare(right.full_name),
      );
    });

    setRecipients((current) => [
      ...current.filter((r) => r.campaign_id !== selectedCampaignId),
      ...importedCustomers.map((c) => ({
        campaign_id: selectedCampaignId,
        customer_id: c.id,
      })),
    ]);
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Switch mode tabs */}
      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("campaign")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition ${
            activeTab === "campaign"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Megaphone className="size-4" />
          Campaign Broadcast
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("instant")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition ${
            activeTab === "instant"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Sparkles className="size-4" />
          Quick Instant Message
        </button>
      </div>

      {activeTab === "instant" && (
        <InstantMessageTab
          customers={customers}
          initialTags={initialTags}
          initialCustomerTags={initialCustomerTags}
        />
      )}

      {activeTab === "campaign" && (
        <CampaignMessageTab
          initialCampaigns={initialCampaigns}
          customers={customers}
          recipients={recipients}
          initialTags={initialTags}
          initialCustomerTags={initialCustomerTags}
          onRecipientsUpdated={handleRecipientsUpdated}
        />
      )}
    </div>
  );
}
