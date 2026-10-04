"use client";

import { useState } from "react";
import CampaignAudienceManager from "../campaigns/campaign-details/campaign-audience-manager";

type Campaign = {
  id: string;
  name: string;
  message_body: string;
  status: string;
};

type Customer = {
  id: string;
  full_name: string;
  phone_e164: string;
  email: string | null;
};

type CampaignRecipient = {
  campaign_id: string;
  customer_id: string;
};

type Tag = {
  id: string;
  name: string;
};

type CustomerTag = {
  customer_id: string;
  tag_id: string;
};

type SendMessageManagerProps = {
  initialCampaigns: Campaign[];
  initialCustomers: Customer[];
  initialRecipients: CampaignRecipient[];
  initialTags: Tag[];
  initialCustomerTags: CustomerTag[];
};

export default function SendMessageManager({
  initialCampaigns,
  initialCustomers,
  initialRecipients,
  initialTags,
  initialCustomerTags,
}: SendMessageManagerProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const selectedCampaign = initialCampaigns.find(
    (campaign) => campaign.id === selectedCampaignId,
  );
  const selectedRecipients = initialRecipients.filter(
    (recipient) => recipient.campaign_id === selectedCampaignId,
  );

  return (
    <div className="mt-8">
      {initialCampaigns.length === 0 ? (
        <section className="rounded-xl border bg-white p-5">
          <p className="font-medium">No campaigns yet</p>
          <p className="mt-1 text-sm text-gray-600">
            Create a campaign before selecting its audience.
          </p>
        </section>
      ) : (
        <>
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <label
              className="block text-sm font-medium"
              htmlFor="send-message-campaign"
            >
              1. Select a campaign
            </label>
            <select
              className="mt-2 w-full rounded-md border bg-white p-2 sm:max-w-xl"
              id="send-message-campaign"
              value={selectedCampaignId}
              onChange={(event) => setSelectedCampaignId(event.target.value)}
            >
              <option value="">Choose a campaign</option>
              {initialCampaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </section>

          {selectedCampaign && (
            <>
              <section className="mt-5 rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="text-sm font-medium">Campaign message</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                  {selectedCampaign.message_body}
                </p>
              </section>

              <h2 className="mt-8 text-lg font-semibold">2. Select audience</h2>
              <CampaignAudienceManager
                key={selectedCampaign.id}
                campaignId={selectedCampaign.id}
                initialCustomers={initialCustomers}
                initialRecipients={selectedRecipients}
                initialTags={initialTags}
                initialCustomerTags={initialCustomerTags}
              />

              <section className="mt-5 rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="font-medium">3. Send</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Message sending is not available yet.
                </p>
                <button
                  className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white opacity-50"
                  type="button"
                  disabled
                >
                  Send message
                </button>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
