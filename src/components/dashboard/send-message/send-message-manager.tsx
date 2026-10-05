"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCheck,
  Info,
  Megaphone,
  Search,
  Send,
  Sparkles,
  Tag as TagIcon,
  Users,
} from "lucide-react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import { showToast } from "@/components/ui/toast";
import { Textarea } from "@/components/ui/textarea";
import type { SendMessageManagerProps } from "@/types/campaign";
import type { Customer } from "@/types/customer";
import CampaignAudienceManager from "../campaigns/campaign-details/campaign-audience-manager";
import CustomerImporter from "../customers/import/customer-import";

type ImportedCustomer = Customer;

export default function SendMessageManager({
  initialCampaigns,
  initialCustomers,
  initialRecipients,
  initialTags,
  initialCustomerTags,
}: SendMessageManagerProps) {
  const [activeTab, setActiveTab] = useState<"campaign" | "instant">("campaign");
  const [selectedCampaignId, setSelectedCampaignId] = useState(
    initialCampaigns.length > 0 ? initialCampaigns[0].id : "",
  );
  const [instantMessage, setInstantMessage] = useState("");
  const [instantAudienceIds, setInstantAudienceIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [instantAudienceSearch, setInstantAudienceSearch] = useState("");
  const [customers, setCustomers] = useState(initialCustomers);
  const [recipients, setRecipients] = useState(initialRecipients);
  const [audienceVersion, setAudienceVersion] = useState(0);

  const filteredInstantCustomers = useMemo(() => {
    const query = instantAudienceSearch.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(
      (customer) =>
        customer.full_name.toLowerCase().includes(query) ||
        customer.phone_e164.toLowerCase().includes(query) ||
        (customer.email?.toLowerCase().includes(query) ?? false),
    );
  }, [customers, instantAudienceSearch]);

  const selectedCampaign = initialCampaigns.find(
    (campaign) => campaign.id === selectedCampaignId,
  );
  const selectedRecipients = recipients.filter(
    (recipient) => recipient.campaign_id === selectedCampaignId,
  );

  function handleToggleInstantTag(tagName: string, customerIds: string[]) {
    const allSelected =
      customerIds.length > 0 &&
      customerIds.every((customerId) => instantAudienceIds.has(customerId));

    setInstantAudienceIds((current) => {
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
      message: `${importedCustomers.length} spreadsheet recipients are now the active audience for this campaign. Phone numbers were matched with existing contacts to avoid duplicates.`,
    };
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

      {/* QUICK INSTANT MESSAGE TAB */}
      {activeTab === "instant" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Send className="size-4 text-emerald-600" />
            <h2 className="text-[15px] font-bold text-slate-950">Instant Message</h2>
          </div>
          <p className="mt-1 text-[13px] text-slate-500">
            Compose and preview an ad-hoc message. (Live WhatsApp delivery is being connected)
          </p>

          <section className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-slate-900">
                  Select Audience
                </h3>
                <p className="mt-0.5 text-[12px] text-slate-500">
                  Choose the customers who should receive this instant message.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
                <Users className="size-3.5" />
                {instantAudienceIds.size} of {customers.length} selected
              </span>
            </div>

            {initialTags.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <TagIcon className="size-3.5 text-emerald-600" />
                  <h4 className="text-[12px] font-semibold text-slate-800">
                    Add customers by tag
                  </h4>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {initialTags.map((tag) => {
                    const taggedCustomers = initialCustomerTags
                      .filter((item) => item.tag_id === tag.id)
                      .map((item) => item.customer_id);
                    const availableCount = taggedCustomers.filter(
                      (id) => !instantAudienceIds.has(id),
                    ).length;
                    const allTaggedCustomersSelected =
                      taggedCustomers.length > 0 && availableCount === 0;

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        disabled={taggedCustomers.length === 0}
                        aria-label={
                          allTaggedCustomersSelected
                            ? `Remove customers with ${tag.name} tag from audience`
                            : `Add customers with ${tag.name} tag to audience`
                        }
                        onClick={() =>
                          handleToggleInstantTag(tag.name, taggedCustomers)
                        }
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          allTaggedCustomersSelected
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                            : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50"
                        }`}
                      >
                        <span>{tag.name}</span>
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {allTaggedCustomersSelected
                            ? "Added · click to remove"
                            : `+${availableCount}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative block sm:max-w-md sm:flex-1">
                <span className="sr-only">Search customers</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Search name, phone, or email"
                  value={instantAudienceSearch}
                  onChange={(event) =>
                    setInstantAudienceSearch(event.target.value)
                  }
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  type="button"
                  disabled={
                    customers.length === 0 ||
                    filteredInstantCustomers.every((customer) =>
                      instantAudienceIds.has(customer.id),
                    )
                  }
                  onClick={() =>
                    setInstantAudienceIds((current) => {
                      const next = new Set(current);
                      filteredInstantCustomers.forEach((customer) =>
                        next.add(customer.id),
                      );
                      return next;
                    })
                  }
                >
                  <CheckCheck className="size-3.5" />
                  Select {instantAudienceSearch.trim() ? "filtered" : "all"}
                </button>
                <button
                  className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  type="button"
                  disabled={instantAudienceIds.size === 0}
                  onClick={() => setInstantAudienceIds(new Set())}
                >
                  Clear
                </button>
              </div>
            </div>

            {customers.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-white p-5 text-center text-[13px] text-slate-500">
                Add or import customers first to select an audience.
              </p>
            ) : filteredInstantCustomers.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-white p-5 text-center text-[13px] text-slate-500">
                No customers match your search.
              </p>
            ) : (
              <ul className="mt-4 max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                {filteredInstantCustomers.map((customer) => (
                  <li key={customer.id}>
                    <label className="flex cursor-pointer items-center gap-3 p-3 transition hover:bg-slate-50">
                      <input
                        className="size-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
                        type="checkbox"
                        checked={instantAudienceIds.has(customer.id)}
                        onChange={(event) => {
                          const checked = event.currentTarget.checked;
                          setInstantAudienceIds((current) => {
                            const next = new Set(current);
                            if (checked) {
                              next.add(customer.id);
                            } else {
                              next.delete(customer.id);
                            }
                            return next;
                          });
                        }}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-slate-900">
                          {customer.full_name}
                        </span>
                        <span className="block truncate text-[12px] text-slate-500">
                          {customer.phone_e164}
                          {customer.email ? ` · ${customer.email}` : ""}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="mt-4">
            <label className="mb-1 block text-[13px] font-semibold text-slate-700" htmlFor="instant-message">
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
      )}

      {/* CAMPAIGN BROADCAST TAB */}
      {activeTab === "campaign" && (
        <div className="space-y-6">
          {initialCampaigns.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <Megaphone className="mx-auto size-10 text-slate-300" />
              <h3 className="mt-3 text-[15px] font-bold text-slate-900">No campaigns found</h3>
              <p className="mt-1 text-[13px] text-slate-500">
                You must draft at least one campaign before you can select recipients and broadcast messages.
              </p>
            </div>
          ) : (
            <>
              {/* Step 1: Select campaign */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-[12px] font-bold text-emerald-800">
                      1
                    </span>
                    <h2 className="text-[15px] font-bold text-slate-950">Choose Campaign</h2>
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
                        <h2 className="text-[15px] font-bold text-slate-950">Broadcast Dispatch</h2>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
