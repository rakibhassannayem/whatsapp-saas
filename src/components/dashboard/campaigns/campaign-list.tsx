"use client";

import type { Campaign } from "@/types/campaign";
import CampaignItem from "./campaign-item";

interface CampaignListProps {
  campaigns: Campaign[];
  busy: boolean;
  onUpdate: (
    campaignId: string,
    name: string,
    messageBody: string,
  ) => Promise<boolean>;
  onDelete: (campaign: Campaign) => void;
}

export default function CampaignList({
  campaigns,
  busy,
  onUpdate,
  onDelete,
}: CampaignListProps) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-[14px] font-bold text-slate-700">
        Campaign Drafts ({campaigns.length})
      </h2>

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-[14px] font-semibold text-slate-700">No campaigns yet</p>
          <p className="mt-1 text-[13px] text-slate-500">
            Create your first campaign draft above.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {campaigns.map((campaign) => (
            <CampaignItem
              key={campaign.id}
              campaign={campaign}
              busy={busy}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
