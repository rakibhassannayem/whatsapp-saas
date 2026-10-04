"use client";

import { useState, type FormEvent } from "react";
import { dashboardApiRequest } from "@/lib/dashboard-api";

type MessageTemplate = {
  id: string;
  name: string;
  body: string;
  created_at: string;
};

type TemplatesManagerProps = {
  initialTemplates: MessageTemplate[];
};

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
      setMessage(error ?? "Template save করা যায়নি।");
      return;
    }

    setTemplates((current) => [data, ...current]);
    setMessage("Message template save হয়েছে।");
    form.reset();
  }

  async function handleDelete(template: MessageTemplate) {
    const confirmed = window.confirm(
      `"${template.name}" template delete করবে?`,
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
    setMessage("Template delete হয়েছে।");
  }

  return (
    <>
      <section className="mt-8 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">নতুন message template</h2>
        <p className="mt-1 text-sm text-gray-600">
          বারবার ব্যবহার করতে চাও এমন message draft এখানে save করো।
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleCreate}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Template-এর নাম
            </span>
            <input
              className="w-full rounded-md border p-2"
              name="name"
              placeholder="যেমন: Appointment reminder"
              maxLength={100}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Message</span>
            <textarea
              className="min-h-32 w-full rounded-md border p-2"
              name="body"
              placeholder="তোমার message এখানে লেখো"
              required
            />
          </label>

          <button
            className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
            type="submit"
            disabled={busy}
          >
            {busy ? "Saving..." : "Save template"}
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold">
          Saved templates ({templates.length})
        </h2>

        {templates.length === 0 ? (
          <p className="rounded-lg border bg-white p-4 text-gray-600">
            এখনো কোনো template save করা হয়নি।
          </p>
        ) : (
          <ul className="space-y-3">
            {templates.map((template) => (
              <li className="rounded-lg border bg-white p-4" key={template.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                      {template.body}
                    </p>
                  </div>

                  <button
                    className="self-start rounded-md border px-3 py-1 text-sm text-red-700 disabled:opacity-50"
                    type="button"
                    disabled={busy}
                    onClick={() => handleDelete(template)}
                  >
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
          className="mt-4 rounded-md border bg-white p-3 text-sm"
          role="status"
        >
          {message}
        </p>
      )}
    </>
  );
}
