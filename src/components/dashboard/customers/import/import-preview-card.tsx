"use client";

import { Upload } from "lucide-react";
import type { ColumnMapping, ImportRow } from "@/types/customer-import";

interface ImportPreviewCardProps {
  columnMappings: ColumnMapping[];
  rows: ImportRow[];
  busy: boolean;
  submitLabel?: (count: number) => string;
  onImport: () => void;
}

export default function ImportPreviewCard({
  columnMappings,
  rows,
  busy,
  submitLabel,
  onImport,
}: ImportPreviewCardProps) {
  if (columnMappings.length === 0 && rows.length === 0) return null;

  return (
    <>
      {columnMappings.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-[13px] font-bold text-slate-900">Column mapping</h2>
          <ul className="mt-2 space-y-1 text-[12px] text-slate-600">
            {columnMappings.map(({ field, source }) => (
              <li key={field}>
                <span className="font-semibold text-slate-700">{field}</span> ← {source}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-[13px] font-bold text-slate-900">Preview</h2>
          <p className="mt-1 text-[12px] text-slate-500">
            {rows.length} valid rows ready to import.
          </p>
          <ul className="mt-3 divide-y divide-slate-100">
            {rows.slice(0, 5).map((row) => (
              <li className="py-2 text-[13px] text-slate-700" key={row.phone_e164}>
                {row.full_name} — {row.phone_e164}
                {row.email ? ` — ${row.email}` : ""}
              </li>
            ))}
          </ul>
          {rows.length > 5 && (
            <p className="mt-2 text-[12px] text-slate-500">
              Showing the first 5 rows of {rows.length} in the preview.
            </p>
          )}
          <button
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
            type="button"
            onClick={onImport}
            disabled={busy}
          >
            <Upload className="size-4" />
            {busy
              ? "Importing..."
              : submitLabel?.(rows.length) ?? `Import ${rows.length} customers`}
          </button>
        </div>
      )}
    </>
  );
}
