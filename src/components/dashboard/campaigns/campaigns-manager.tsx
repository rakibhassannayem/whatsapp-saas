"use client";

import { useState } from "react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import type {
  Campaign,
  CampaignsManagerProps,
} from "@/types/campaign";
import CampaignCreateCard from "./campaign-create-card";
import CampaignList from "./campaign-list";

export default function CampaignsManager({
  initialCampaigns,
  initialTemplates,
}: CampaignsManagerProps) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreate(name: string, body: string): Promise<boolean> {
    setMessage("");
    setBusy(true);

    const { data, error } = await dashboardApiRequest<
      Omit<Campaign, "audience_count">
    >("/api/dashboard/campaigns", {
      method: "POST",
      body: { name, message_body: body },
    });

    setBusy(false);

    if (error || !data) {
      setMessage(error ?? "Could not save campaign.");
      return false;
    }

    setCampaigns((current) => [{ ...data, audience_count: 0 }, ...current]);
    setMessage("Campaign draft saved successfully.");
    return true;
  }

  async function handleUpdate(
    campaignId: string,
    name: string,
    body: string,
  ): Promise<boolean> {
    setMessage("");
    setBusy(true);

    const { data, error } = await dashboardApiRequest<
      Omit<Campaign, "audience_count">
    >("/api/dashboard/campaigns", {
      method: "PATCH",
      body: { id: campaignId, name, message_body: body },
    });

    setBusy(false);

    if (error || !data) {
      setMessage(error ?? "Could not update campaign.");
      return false;
    }

    setCampaigns((current) =>
      current.map((campaign) =>
        campaign.id === campaignId ? { ...campaign, ...data } : campaign,
      ),
    );
    setMessage("Campaign draft updated.");
    return true;
  }

  async function handleDelete(campaign: Campaign) {
    const confirmed = window.confirm(
      `Delete the campaign "${campaign.name}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    setMessage("");
    setBusy(true);

    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/campaigns",
      { method: "DELETE", body: { id: campaign.id } },
    );

    setBusy(false);

    if (error) {
      setMessage(error);
      return;
    }

    setCampaigns((current) =>
      current.filter((item) => item.id !== campaign.id),
    );
    setMessage("Campaign deleted.");
  }

  return (
    <>
      <CampaignCreateCard
        initialTemplates={initialTemplates}
        busy={busy}
        onCreate={handleCreate}
      />

      <CampaignList
        campaigns={campaigns}
        busy={busy}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />

      {message && (
        <p
          className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-700"
          role="status"
        >
          {message}
        </p>
      )}
    </>
  );
}
