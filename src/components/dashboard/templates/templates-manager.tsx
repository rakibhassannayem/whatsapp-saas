"use client";

import { useState } from "react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import type { MessageTemplate, TemplatesManagerProps } from "@/types/campaign";
import TemplateForm from "./template-form";
import TemplateList from "./template-list";

export default function TemplatesManager({
  initialTemplates,
}: TemplatesManagerProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function handleTemplateCreated(newTemplate: MessageTemplate) {
    setTemplates((current) => [newTemplate, ...current]);
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
      <TemplateForm
        busy={busy}
        setBusy={setBusy}
        onTemplateCreated={handleTemplateCreated}
        setMessage={setMessage}
      />

      <TemplateList
        templates={templates}
        busy={busy}
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
