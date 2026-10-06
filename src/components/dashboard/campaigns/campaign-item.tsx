"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Pencil, Trash2, Users } from "lucide-react";
import type { Campaign } from "@/types/campaign";

interface CampaignItemProps {
  campaign: Campaign;
  busy: boolean;
  onUpdate: (
    campaignId: string,
    name: string,
    messageBody: string,
  ) => Promise<boolean>;
  onDelete: (campaign: Campaign) => void;
}

export default function CampaignItem({
  campaign,
  busy,
  onUpdate,
  onDelete,
}: CampaignItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(campaign.name);
  const [editMessageBody, setEditMessageBody] = useState(campaign.message_body);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const success = await onUpdate(campaign.id, editName.trim(), editMessageBody.trim());
    if (success) {
      setIsEditing(false);
    }
  }

  function handleStartEdit() {
    setEditName(campaign.name);
    setEditMessageBody(campaign.message_body);
    setIsEditing(true);
  }

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {isEditing ? (
        <form className="space-y-3" onSubmit={handleSave}>
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-slate-700">
              Campaign name
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[13px] outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              value={editName}
              maxLength={100}
              required
              onChange={(event) => setEditName(event.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-slate-700">
              Message
            </label>
            <textarea
              className="min-h-32 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[13px] outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              value={editMessageBody}
              required
              onChange={(event) => setEditMessageBody(event.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              className="rounded-full bg-emerald-500 px-4 py-2 text-[12px] font-bold text-white disabled:opacity-50"
              type="submit"
              disabled={busy}
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
            <button
              className="rounded-full border border-slate-200 px-4 py-2 text-[12px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              type="button"
              disabled={busy}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[14px] font-bold text-slate-950">
                {campaign.name}
              </h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-slate-600">
                {campaign.status}
              </span>
              <span className="flex items-center gap-1 text-[12px] text-slate-500">
                <Users className="size-3" />
                {campaign.audience_count} recipients
              </span>
            </div>

            <p className="mt-2 whitespace-pre-wrap text-[13px] text-slate-600 line-clamp-3">
              {campaign.message_body}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              href={`/dashboard/campaigns/${campaign.id}`}
            >
              <Users className="size-3.5" />
              Select audience
            </Link>

            <button
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              type="button"
              disabled={busy}
              onClick={handleStartEdit}
            >
              <Pencil className="size-3.5" />
              Edit
            </button>

            <button
              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-[12px] font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
              type="button"
              disabled={busy}
              onClick={() => onDelete(campaign)}
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
