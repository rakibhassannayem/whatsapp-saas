"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Campaign = {
  id: string;
  name: string;
  message_body: string;
  audience_count: number;
  status: string;
  created_at: string;
};

type MessageTemplate = {
  id: string;
  name: string;
  body: string;
};

type CampaignsManagerProps = {
  businessId: string;
  initialCampaigns: Campaign[];
  initialTemplates: MessageTemplate[];
};

export default function CampaignsManager({
  businessId,
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

    const supabase = createClient();
    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        business_id: businessId,
        name,
        message_body: body,
      })
      .select("id, name, message_body, status, created_at")
      .single();

    setBusy(false);

    if (error) {
      if (error.code === "23505") {
        setMessage("এই নামে campaign আগে থেকেই আছে।");
      } else {
        setMessage(error.message);
      }
      return;
    }

    setCampaigns((current) => [
      { ...(data as Omit<Campaign, "audience_count">), audience_count: 0 },
      ...current,
    ]);
    setMessage("Campaign draft save হয়েছে।");
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

    const supabase = createClient();
    const { data, error } = await supabase
      .from("campaigns")
      .update({
        name,
        message_body: body,
      })
      .eq("id", campaignId)
      .eq("business_id", businessId)
      .select("id, name, message_body, status, created_at")
      .single();

    setBusy(false);

    if (error) {
      if (error.code === "23505") {
        setMessage("এই নামে অন্য একটি campaign আগে থেকেই আছে।");
      } else {
        setMessage(error.message);
      }
      return;
    }

    setCampaigns((current) =>
      current.map((campaign) =>
        campaign.id === campaignId ? { ...campaign, ...data } : campaign,
      ),
    );
    setEditingCampaignId(null);
    setMessage("Campaign draft update হয়েছে।");
  }

  async function handleDelete(campaign: Campaign) {
    const confirmed = window.confirm(
      `"${campaign.name}" campaign draft delete করবে?`,
    );

    if (!confirmed) return;

    setMessage("");
    setBusy(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", campaign.id)
      .eq("business_id", businessId);

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setCampaigns((current) =>
      current.filter((item) => item.id !== campaign.id),
    );
    setMessage("Campaign draft delete হয়েছে।");
  }

  return (
    <>
      <section className="mt-8 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">নতুন campaign draft</h2>
        <p className="mt-1 text-sm text-gray-600">
          Campaign-এর নাম ও message লিখে draft হিসেবে save করো।
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleCreate}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Campaign-এর নাম
            </span>
            <input
              className="w-full rounded-md border p-2"
              name="name"
              placeholder="যেমন: Eid offer"
              maxLength={100}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Saved template ব্যবহার করো (optional)
            </span>
            <select
              className="w-full rounded-md border p-2"
              value={selectedTemplateId}
              disabled={initialTemplates.length === 0}
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
              <option value="">
                {initialTemplates.length === 0
                  ? "এখনো কোনো saved template নেই"
                  : "Template বেছে নাও"}
              </option>
              {initialTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-sm text-gray-600">
              Template বাছলে তার message নিচের ঘরে আসবে; চাইলে edit করতে পারো।
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Message</span>
            <textarea
              className="min-h-32 w-full rounded-md border p-2"
              name="messageBody"
              placeholder="Campaign-এর message এখানে লেখো"
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              required
            />
          </label>

          <button
            className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
            type="submit"
            disabled={busy}
          >
            {busy ? "Saving..." : "Save as draft"}
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold">
          Campaign drafts ({campaigns.length})
        </h2>

        {campaigns.length === 0 ? (
          <p className="rounded-lg border bg-white p-4 text-gray-600">
            এখনো কোনো campaign draft নেই।
          </p>
        ) : (
          <ul className="space-y-3">
            {campaigns.map((campaign) => (
              <li className="rounded-lg border bg-white p-4" key={campaign.id}>
                {editingCampaignId === campaign.id ? (
                  <form
                    className="space-y-3"
                    onSubmit={(event) => void handleUpdate(event, campaign.id)}
                  >
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium">
                        Campaign-এর নাম
                      </span>
                      <input
                        className="w-full rounded-md border p-2"
                        value={editName}
                        maxLength={100}
                        required
                        onChange={(event) => setEditName(event.target.value)}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-sm font-medium">
                        Message
                      </span>
                      <textarea
                        className="min-h-32 w-full rounded-md border p-2"
                        value={editMessageBody}
                        required
                        onChange={(event) =>
                          setEditMessageBody(event.target.value)
                        }
                      />
                    </label>

                    <div className="flex gap-2">
                      <button
                        className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                        type="submit"
                        disabled={busy}
                      >
                        {busy ? "Saving..." : "Save changes"}
                      </button>
                      <button
                        className="rounded-md border px-3 py-2 text-sm"
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
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium">{campaign.name}</h3>
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                          {campaign.status}
                        </span>
                        <span className="text-xs text-gray-600">
                          {campaign.audience_count} customer selected
                        </span>
                      </div>

                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                        {campaign.message_body}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Link
                        className="rounded-md border px-3 py-1 text-sm"
                        href={`/dashboard/campaigns/${campaign.id}`}
                      >
                        Select audience
                      </Link>

                      <button
                        className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setEditingCampaignId(campaign.id);
                          setEditName(campaign.name);
                          setEditMessageBody(campaign.message_body);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="rounded-md border px-3 py-1 text-sm text-red-700 disabled:opacity-50"
                        type="button"
                        disabled={busy}
                        onClick={() => handleDelete(campaign)}
                      >
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
          className="mt-4 rounded-md border bg-white p-3 text-sm"
          role="status"
        >
          {message}
        </p>
      )}
    </>
  );
}
