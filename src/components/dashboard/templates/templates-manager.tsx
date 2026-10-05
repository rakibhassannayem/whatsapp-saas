"use client";

import { useState, type FormEvent } from "react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import { Trash2 } from "lucide-react";
import type { MessageTemplate, TemplatesManagerProps } from "@/types/campaign";

export default function TemplatesManager({
  initialTemplates,
}: TemplatesManagerProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();

    setMessage("");
    setBusy(true);

    const { data, error } = await dashboardApiRequest<MessageTemplate>(
      "/api/dashboard/templates",
      { method: "POST", body: { name, body } },
    );

    setBusy(false);

    if (error || !data) {
      setMessage(error ?? "Could not save template.");
      return;
    }

    setTemplates((current) => [data, ...current]);
    setMessage("Template saved successfully.");
    form.reset();
  }

  async function handleDelete(template: MessageTemplate) {
    const confirmed = window.confirm(
      `Delete the template "${template.name}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    setMessage("");
    setBusy(true);

    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/templates",
      { method: "DELETE", body: { id: template.id } },
    );

    setBusy(false);

    if (error) {
      setMessage(error);
      return;
    }

    setTemplates((current) =>
      current.filter((item) => item.id !== template.id),
    );
    setMessage("Template deleted.");
  }

  return (
    <>
      {/* Create form */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-[15px] font-bold text-slate-950">New Template</h2>
        <p className="mt-1 text-[13px] text-slate-500">
          Save messages you send often so you can reuse them quickly when creating campaigns.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleCreate}>
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-slate-700" htmlFor="template-name">
              Template name
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[13px] outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              id="template-name"
              name="name"
              placeholder="e.g. Appointment Reminder"
              maxLength={100}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-slate-700" htmlFor="template-body">
              Message
            </label>
            <textarea
              className="min-h-32 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[13px] outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              id="template-body"
              name="body"
              placeholder="Write your template message here…"
              required
            />
          </div>

          <button
            className="rounded-full bg-emerald-500 px-5 py-2 text-[13px] font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
            type="submit"
            disabled={busy}
          >
            {busy ? "Saving…" : "Save template"}
          </button>
        </form>
      </section>

      {/* Template list */}
      <section className="mt-6">
        <h2 className="mb-3 text-[14px] font-bold text-slate-700">
          Saved Templates ({templates.length})
        </h2>

        {templates.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-[14px] font-semibold text-slate-700">No templates yet</p>
            <p className="mt-1 text-[13px] text-slate-500">
              Save your first template using the form above.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {templates.map((template) => (
              <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={template.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14px] font-bold text-slate-950">{template.name}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-[13px] text-slate-600">
                      {template.body}
                    </p>
                  </div>

                  <button
                    className="self-start inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-[12px] font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                    type="button"
                    disabled={busy}
                    onClick={() => handleDelete(template)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </button>
                </div>
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
