"use client";

import { Trash2 } from "lucide-react";
import type { MessageTemplate } from "@/types/campaign";

interface TemplateListProps {
  templates: MessageTemplate[];
  busy: boolean;
  onDelete: (template: MessageTemplate) => void;
}

export default function TemplateList({
  templates,
  busy,
  onDelete,
}: TemplateListProps) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-[14px] font-bold text-slate-700">
        Saved Templates ({templates.length})
      </h2>

      {templates.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-[14px] font-semibold text-slate-700">
            No templates yet
          </p>
          <p className="mt-1 text-[13px] text-slate-500">
            Save your first template using the form above.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {templates.map((template) => (
            <li
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              key={template.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-bold text-slate-950">
                    {template.name}
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-[13px] text-slate-600">
                    {template.body}
                  </p>
                </div>

                <button
                  className="self-start inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-[12px] font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  type="button"
                  disabled={busy}
                  onClick={() => onDelete(template)}
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
  );
}
