"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileSpreadsheet, TriangleAlert, Upload } from "lucide-react";
import { cn } from "cn";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import type {
  ColumnMapping,
  ImportCompletion,
  ImportRow,
  InvalidRow,
  ImportedCustomer,
} from "@/types/customer-import";
import { parseImportFile } from "./import-file-parser";
import ImportTagBanner from "./import-tag-banner";
import ImportIssuesCard from "./import-issues-card";
import ImportPreviewCard from "./import-preview-card";

interface CustomerImporterProps {
  compact?: boolean;
  initialTags?: { id: string; name: string }[];
  showTagging?: boolean;
  submitLabel?: (count: number) => string;
  onImported?: (customers: ImportedCustomer[]) => Promise<ImportCompletion>;
}

export default function CustomerImporter({
  compact = false,
  initialTags = [],
  showTagging = true,
  submitLabel,
  onImported,
}: CustomerImporterProps) {
  const router = useRouter();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [invalidRows, setInvalidRows] = useState<InvalidRow[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function setStatus(text: string, error = false) {
    setMessage(text);
    setIsError(error);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setRows([]);
    setInvalidRows([]);
    setColumnMappings([]);
    setStatus("");
    setImportedIds([]);

    if (!file) return;

    try {
      const result = await parseImportFile(file);
      setColumnMappings(result.columnMappings);
      setRows(result.validRows);
      setInvalidRows(result.invalidRows);
      setStatus(
        `${result.validRows.length} valid rows found; ${result.invalidRows.length} rows skipped.`,
        result.validRows.length === 0,
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Could not read the file.",
        true,
      );
    }
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setStatus("");
    setBusy(true);

    const { data, error } = await dashboardApiRequest<{
      addedCount: number;
      customerIds: string[];
      matchedCustomers: ImportedCustomer[];
    }>("/api/dashboard/customers/import", { method: "POST", body: { rows } });

    if (error) {
      setBusy(false);
      setStatus(error, true);
      return;
    }

    const addedCount = data?.addedCount ?? 0;
    const matchedCustomers = data?.matchedCustomers;
    if (!matchedCustomers || matchedCustomers.length !== rows.length) {
      setBusy(false);
      setStatus(
        "Customers were imported, but the saved customer list could not be confirmed. Please upload the file again to retry.",
        true,
      );
      router.refresh();
      return;
    }

    setRows([]);
    setImportedIds(data?.customerIds ?? []);

    if (onImported) {
      const completion = await onImported(matchedCustomers);
      if (completion.error) {
        setBusy(false);
        setStatus(completion.error, true);
        router.refresh();
        return;
      }
      setStatus(
        completion.message ??
          `${matchedCustomers.length} imported customers were added to the audience.`,
      );
      setBusy(false);
      router.refresh();
      return;
    }

    const skipped = invalidRows.length + (rows.length - addedCount);
    setStatus(
      `${addedCount} customers imported. ${skipped} invalid or duplicate rows skipped.`,
    );
    setBusy(false);
    router.refresh();
  }

  return (
    <section className={compact ? "space-y-4" : "mt-6 space-y-4"}>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="flex items-center gap-2 text-[13px] font-bold text-slate-900">
          <FileSpreadsheet className="size-4 text-emerald-600" />
          Upload Excel or CSV
        </p>
        <p className="mt-1.5 text-[12px] leading-5 text-slate-500">
          Headers:{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px]">
            full_name,phone_e164,email
          </code>{" "}
          or{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px]">
            Name,Phone,Email
          </code>
        </p>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-emerald-400 hover:bg-emerald-50/50">
          <Upload className="size-6 text-slate-400" />
          <span className="text-[13px] font-semibold text-slate-700">
            Choose a .csv or .xlsx file
          </span>
          <span className="text-[12px] text-slate-500">
            Max 2 MB • up to 1,000 rows • E.164 like +8801712345678
          </span>
          <input
            type="file"
            accept=".csv,.xlsx,text/csv"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>
      </div>

      {message && (
        <p
          role="status"
          className={cn(
            "flex items-start gap-2 rounded-xl px-4 py-2.5 text-[13px] leading-5",
            isError ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700",
          )}
        >
          {isError ? (
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          )}
          {message}
        </p>
      )}

      {showTagging && (
        <ImportTagBanner
          importedIds={importedIds}
          initialTags={initialTags}
          busy={busy}
          onStatusChange={setStatus}
        />
      )}

      <ImportPreviewCard
        columnMappings={columnMappings}
        rows={rows}
        busy={busy}
        submitLabel={submitLabel}
        onImport={handleImport}
      />

      <ImportIssuesCard invalidRows={invalidRows} />
    </section>
  );
}
