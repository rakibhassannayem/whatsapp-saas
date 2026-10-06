"use client";

import { useState } from "react";
import { Info, Megaphone, Send } from "lucide-react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import type { Campaign, CampaignRecipient } from "@/types/campaign";
import type { Customer, CustomerTag, Tag } from "@/types/customer";
import CampaignAudienceManager from "../campaigns/campaign-details/campaign-audience-manager";
import CustomerImporter from "../customers/import/customer-import";

interface CampaignMessageTabProps {
  initialCampaigns: Campaign[];
  customers: Customer[];
  recipients: CampaignRecipient[];
  initialTags: Tag[];
  initialCustomerTags: CustomerTag[];
  onRecipientsUpdated: (
    importedCustomers: Customer[],
    selectedCampaignId: string,
  ) => void;
}

export default function CampaignMessageTab({
  initialCampaigns,
  customers,
  recipients,
  initialTags,
  initialCustomerTags,
  onRecipientsUpdated,
}: CampaignMessageTabProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState(
    initialCampaigns.length > 0 ? initialCampaigns[0].id : "",
  );
  const [audienceVersion, setAudienceVersion] = useState(0);

  const selectedCampaign = initialCampaigns.find(
    (campaign) => campaign.id === selectedCampaignId,
  );
  const selectedRecipients = recipients.filter(
    (recipient) => recipient.campaign_id === selectedCampaignId,
  );

  async function handleImportRecipients(importedCustomers: Customer[]) {
    if (!selectedCampaign) {
      return {
        error: "Select a campaign before importing its recipient list.",
      };
    }

    const customerIds = importedCustomers.map((customer) => customer.id);
    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/campaigns/recipients",
      {
        method: "POST",
        body: {
          campaignId: selectedCampaign.id,
          customerIds,
          replaceExisting: true,
        },
      },
    );

    if (error) {
      return {
        error: `Customers were saved, but the campaign audience could not be updated: ${error}`,
      };
    }

    onRecipientsUpdated(importedCustomers, selectedCampaign.id);
    setAudienceVersion((current) => current + 1);

    return {
      error: null,
      message: `${importedCustomers.length} spreadsheet recipients are now the active audience for this campaign. Phone numbers were matched with existing contacts to avoid duplicates.`,
    };
  }

  if (initialCampaigns.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Megaphone className="mx-auto size-10 text-slate-300" />
        <h3 className="mt-3 text-[15px] font-bold text-slate-900">
          No campaigns found
        </h3>
        <p className="mt-1 text-[13px] text-slate-500">
          You must draft at least one campaign before you can select recipients and broadcast messages.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Select campaign */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-[12px] font-bold text-emerald-800">
              1
            </span>
            <h2 className="text-[15px] font-bold text-slate-950">
              Choose Campaign
            </h2>
          </div>
          <span className="text-[12px] text-slate-400">
            {initialCampaigns.length} available
          </span>
        </div>

        <div className="mt-4">
          <label className="sr-only" htmlFor="send-message-campaign">
            Select a campaign
          </label>
          <select
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-[13px] font-medium outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 sm:max-w-xl"
            id="send-message-campaign"
            value={selectedCampaignId}
            onChange={(event) => setSelectedCampaignId(event.target.value)}
          >
            {initialCampaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name} ({campaign.status ?? "draft"})
              </option>
            ))}
          </select>
        </div>

        {selectedCampaign && (
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Broadcast Message Preview
              </span>
              <span className="rounded-full bg-slate-200/60 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {selectedCampaign.status ?? "draft"}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">
              {selectedCampaign.message_body}
            </p>
          </div>
        )}
      </section>

      {selectedCampaign && (
        <>
          {/* Step 2: Spreadsheet Quick Import */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-[12px] font-bold text-emerald-800">
                2
              </span>
              <div>
                <h2 className="text-[15px] font-bold text-slate-950">
                  Import Audience Spreadsheet (Optional)
                </h2>
                <p className="mt-0.5 text-[12px] text-slate-500">
                  Upload an Excel or CSV file to immediately set this campaign&apos;s audience. Contacts are deduplicated by phone.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <CustomerImporter
                compact
                showTagging={false}
                submitLabel={(count) => `Use ${count} recipients for this campaign`}
                onImported={handleImportRecipients}
              />
            </div>
          </section>

          {/* Step 3: Select & Review Audience */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-[12px] font-bold text-emerald-800">
                3
              </span>
              <div>
                <h2 className="text-[15px] font-bold text-slate-950">
                  Target Audience Selection
                </h2>
                <p className="mt-0.5 text-[12px] text-slate-500">
                  Fine-tune which contacts will receive the message by filtering or selecting tags.
                </p>
              </div>
            </div>

            <div className="mt-2">
              <CampaignAudienceManager
                key={`${selectedCampaign.id}:${audienceVersion}`}
                campaignId={selectedCampaign.id}
                initialCustomers={customers}
                initialRecipients={selectedRecipients}
                initialTags={initialTags}
                initialCustomerTags={initialCustomerTags}
              />
            </div>
          </section>

          {/* Step 4: Dispatch / Delivery */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-[12px] font-bold text-emerald-800">
                4
              </span>
              <div>
                <h2 className="text-[15px] font-bold text-slate-950">
                  Broadcast Dispatch
                </h2>
                <p className="mt-0.5 text-[12px] text-slate-500">
                  Review recipient count and launch delivery.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-[13px] text-blue-800">
              <div className="flex items-start gap-2.5">
                <Info className="mt-0.5 size-4 shrink-0 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">
                    Audience configured: {selectedRecipients.length} recipients selected
                  </p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-blue-700">
                    WhatsApp Business Cloud API connection is currently in configuration mode. Once connected, broadcasts will send with real-time delivery status tracking.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-2.5 text-[13px] font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                disabled
                title="WhatsApp message delivery is currently disabled."
              >
                <Send className="size-4" />
                Send Broadcast to {selectedRecipients.length} Contacts
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
