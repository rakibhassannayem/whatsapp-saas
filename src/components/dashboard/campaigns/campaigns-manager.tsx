"use client";

import { useState, type FormEvent } from "react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import Link from "next/link";
import { Pencil, Trash2, Users } from "lucide-react";
import type {
  Campaign,
  CampaignsManagerProps,
} from "@/types/campaign";

export default function CampaignsManager({
  initialCampaigns,
  initialTemplates,
}: CampaignsManagerProps) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(
    null,
  );
  const [editName, setEditName] = useState("");
  const [editMessageBody, setEditMessageBody] = useState("");

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const body = messageBody.trim();

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
      return;
    }

    setCampaigns((current) => [{ ...data, audience_count: 0 }, ...current]);
    setMessage("Campaign draft saved successfully.");
    setSelectedTemplateId("");
    setMessageBody("");

    form.reset();
  }

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>,
    campaignId: string,
  ) {
    event.preventDefault();

    const name = editName.trim();
    const body = editMessageBody.trim();

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
      return;
    }

    setCampaigns((current) =>
      current.map((campaign) =>
        campaign.id === campaignId ? { ...campaign, ...data } : campaign,
      ),
    );
    setEditingCampaignId(null);
    setMessage("Campaign draft updated.");
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
      {/* Create form */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-[15px] font-bold text-slate-950">New Campaign Draft</h2>
        <p className="mt-1 text-[13px] text-slate-500">
          Give your campaign a name and write the message. You can choose a saved template to pre-fill the message.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleCreate}>
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-slate-700" htmlFor="campaign-name">
              Campaign name
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[13px] outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              id="campaign-name"
              name="name"
              placeholder="e.g. Eid Special Offer"
              maxLength={100}
              required
            />
          </div>

          {initialTemplates.length > 0 && (
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-slate-700" htmlFor="template-select">
                Use a saved template <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[13px] outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                id="template-select"
                value={selectedTemplateId}
                onChange={(event) => {
                  const templateId = event.target.value;
                  setSelectedTemplateId(templateId);

                  const template = initialTemplates.find(
                    (item) => item.id === templateId,
                  );

                  if (template) {
                    setMessageBody(template.body);
                  }
                }}
              >
                <option value="">Select a template…</option>
                {initialTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[12px] text-slate-400">
                Selecting a template fills the message below. You can still edit it.
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-slate-700" htmlFor="campaign-message">
              Message
            </label>
            <textarea
              className="min-h-32 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[13px] outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              id="campaign-message"
              name="messageBody"
              placeholder="Write your campaign message here…"
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              required
            />
          </div>

          <button
            className="rounded-full bg-emerald-500 px-5 py-2 text-[13px] font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
            type="submit"
            disabled={busy}
          >
            {busy ? "Saving…" : "Save as draft"}
          </button>
        </form>
      </section>

      {/* Campaign list */}
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
              <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={campaign.id}>
                {editingCampaignId === campaign.id ? (
                  <form
                    className="space-y-3"
                    onSubmit={(event) => void handleUpdate(event, campaign.id)}
                  >
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
                        onChange={(event) =>
                          setEditMessageBody(event.target.value)
                        }
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
                        onClick={() => setEditingCampaignId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[14px] font-bold text-slate-950">{campaign.name}</h3>
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
                        onClick={() => {
                          setEditingCampaignId(campaign.id);
                          setEditName(campaign.name);
                          setEditMessageBody(campaign.message_body);
                        }}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </button>

                      <button
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-[12px] font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                        type="button"
                        disabled={busy}
                        onClick={() => handleDelete(campaign)}
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

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
