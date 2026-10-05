"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import { Textarea } from "@/components/ui/textarea";
import CampaignAudienceManager from "../campaigns/campaign-details/campaign-audience-manager";
import CustomerImporter from "../customers/import/customer-import";

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

type ImportedCustomer = Customer;

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
  const [instantMessage, setInstantMessage] = useState("");
  const [customers, setCustomers] = useState(initialCustomers);
  const [recipients, setRecipients] = useState(initialRecipients);
  const [audienceVersion, setAudienceVersion] = useState(0);
  const selectedCampaign = initialCampaigns.find(
    (campaign) => campaign.id === selectedCampaignId,
  );
  const selectedRecipients = recipients.filter(
    (recipient) => recipient.campaign_id === selectedCampaignId,
  );

  async function handleImportRecipients(importedCustomers: ImportedCustomer[]) {
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

    setCustomers((current) => {
      const customersById = new Map(current.map((customer) => [customer.id, customer]));
      importedCustomers.forEach((customer) =>
        customersById.set(customer.id, customer),
      );
      return [...customersById.values()].sort((left, right) =>
        left.full_name.localeCompare(right.full_name),
      );
    });
    setRecipients((current) => [
      ...current.filter(
        (recipient) => recipient.campaign_id !== selectedCampaign.id,
      ),
      ...importedCustomers.map((customer) => ({
        campaign_id: selectedCampaign.id,
        customer_id: customer.id,
      })),
    ]);
    setAudienceVersion((current) => current + 1);

    return {
      error: null,
      message: `${importedCustomers.length} spreadsheet recipients are now the only contacts in this campaign audience. Existing customers were matched by phone and not duplicated.`,
    };
  }

  return (
    <div className="mt-8">
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-sm font-medium">Instant message</h2>
        <p className="mt-1 text-sm text-gray-600">
          Write a one-off message without selecting a campaign. Message sending
          is not available yet.
        </p>
        <label className="sr-only" htmlFor="instant-message">
          Instant message text
        </label>
        <Textarea
          className="mt-3 min-h-32"
          id="instant-message"
          placeholder="Write your message..."
          value={instantMessage}
          onChange={(event) => setInstantMessage(event.target.value)}
        />
        <button
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled
          title="Message sending is not available yet."
        >
          <Send className="size-4" />
          Send instant message
        </button>
      </section>

      <h2 className="mt-8 text-lg font-semibold">Campaign messages</h2>
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

              <section className="mt-5 rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="text-sm font-medium">
                  Import a spreadsheet audience
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Importing replaces this campaign&apos;s current audience with
                  only valid numbers from the file. Customers are matched by
                  phone and added to your customer list without creating
                  duplicates. Importing does not send a message.
                </p>
                <CustomerImporter
                  compact
                  showTagging={false}
                  submitLabel={(count) => `Import and use ${count} recipients`}
                  onImported={handleImportRecipients}
                />
              </section>

              <h2 className="mt-8 text-lg font-semibold">2. Select audience</h2>
              <CampaignAudienceManager
                key={`${selectedCampaign.id}:${audienceVersion}`}
                campaignId={selectedCampaign.id}
                initialCustomers={customers}
                initialRecipients={selectedRecipients}
                initialTags={initialTags}
                initialCustomerTags={initialCustomerTags}
              />

              <section className="mt-5 rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="font-medium">3. Send</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Your campaign audience is ready, but WhatsApp message
                  delivery is not configured yet. This page currently prepares
                  the audience but cannot send messages.
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
