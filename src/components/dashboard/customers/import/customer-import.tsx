"use client";

import Link from "next/link";
import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import { CheckCircle2, FileSpreadsheet, Tag as TagIcon, TriangleAlert, Upload } from "lucide-react";
import { cn } from "cn";

type ImportRow = {
  full_name: string;
  phone_e164: string;
  email: string | null;
};

type ImportedCustomer = ImportRow & { id: string };
type ImportCompletion = {
  error: string | null;
  message?: string;
};

type InvalidRow = { rowNumber: number; reasons: string[] };
type ColumnMapping = { field: string; source: string };

const phonePattern = /^\+[1-9][0-9]{1,14}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxFileSize = 2 * 1024 * 1024;
const maxRows = 1000;
const maxDisplayedIssues = 20;

function normalizeHeader(header: unknown) {
  const normalized = String(header ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  if (["fullname", "name", "customername"].includes(normalized)) {
    return "full_name";
  }
  if (
    ["phone", "phonenumber", "mobile", "mobilenumber", "phonee164"].includes(
      normalized,
    )
  ) {
    return "phone_e164";
  }
  if (["email", "emailaddress"].includes(normalized)) return "email";
  return normalized;
}

function buildImportRows(
  headers: unknown[],
  values: unknown[][],
  parserIssues: InvalidRow[] = [],
) {
  const normalizedHeaders = headers.map(normalizeHeader);
  const nameIndex = normalizedHeaders.indexOf("full_name");
  const phoneIndex = normalizedHeaders.indexOf("phone_e164");
  const emailIndex = normalizedHeaders.indexOf("email");

  if (nameIndex < 0 || phoneIndex < 0) {
    throw new Error("Header-এ Name/full_name এবং Phone/phone_e164 থাকতে হবে।");
  }

  const parserIssuesByRow = new Map(
    parserIssues.map((issue) => [issue.rowNumber - 2, issue.reasons]),
  );
  const seenPhones = new Set<string>();
  const validRows: ImportRow[] = [];
  const invalidRows: InvalidRow[] = [];

  values.forEach((cells, index) => {
    const rowNumber = index + 2;
    const fullName = String(cells[nameIndex] ?? "").trim();
    const phone = String(cells[phoneIndex] ?? "").trim();
    const email = String(
      emailIndex < 0 ? "" : (cells[emailIndex] ?? ""),
    ).trim();
    const reasons = [...(parserIssuesByRow.get(index) ?? [])];

    if (!fullName) reasons.push("Name ফাঁকা");
    else if (fullName.length > 120) reasons.push("Name 120 অক্ষরের বেশি");
    if (!phone) reasons.push("Phone ফাঁকা");
    else if (!phonePattern.test(phone))
      reasons.push("Phone E.164 format-এ নয় (যেমন +8801712345678)");
    if (email && !emailPattern.test(email))
      reasons.push("Email format সঠিক নয়");

    if (reasons.length === 0 && seenPhones.has(phone)) {
      reasons.push("এই ফাইলে একই Phone একাধিকবার আছে");
    }

    if (reasons.length > 0) {
      invalidRows.push({ rowNumber, reasons: [...new Set(reasons)] });
      return;
    }

    seenPhones.add(phone);
    validRows.push({
      full_name: fullName,
      phone_e164: phone,
      email: email || null,
    });
  });

  return { validRows, invalidRows };
}

export default function CustomerImporter({
  compact = false,
  initialTags = [],
  showTagging = true,
  submitLabel,
  onImported,
}: {
  compact?: boolean;
  initialTags?: { id: string; name: string }[];
  showTagging?: boolean;
  submitLabel?: (count: number) => string;
  onImported?: (
    customers: ImportedCustomer[],
  ) => Promise<ImportCompletion>;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [invalidRows, setInvalidRows] = useState<InvalidRow[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [importedTagId, setImportedTagId] = useState("");
  const [tagging, setTagging] = useState(false);
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
    setImportedTagId("");

    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "csv" && extension !== "xlsx") {
      setStatus("Please choose a .csv or .xlsx file.", true);
      return;
    }
    if (file.size > maxFileSize) {
      setStatus("File must be smaller than 2 MB.", true);
      return;
    }

    try {
      let headers: unknown[];
      let values: unknown[][];
      let parserIssues: InvalidRow[] = [];

      if (extension === "csv") {
        const parsed = Papa.parse<string[]>(await file.text(), {
          header: false,
          skipEmptyLines: "greedy",
        });
        const [headerRow = [], ...dataRows] = parsed.data;
        headers = headerRow;
        values = dataRows;
        parserIssues = parsed.errors.map((error) => ({
          rowNumber: (error.row ?? 0) + 2,
          reasons: [`CSV parse issue: ${error.message}`],
        }));
      } else {
        const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!firstSheet)
          throw new Error("XLSX file-এ কোনো worksheet পাওয়া যায়নি।");
        const [headerRow = [], ...dataRows] = XLSX.utils.sheet_to_json<
          unknown[]
        >(firstSheet, { header: 1, defval: "", raw: false, blankrows: false });
        headers = headerRow;
        values = dataRows;
      }

      if (values.length > maxRows) {
        setStatus(`At most ${maxRows} rows can be imported at once.`, true);
        return;
      }

      const result = buildImportRows(headers, values, parserIssues);
      const normalizedHeaders = headers.map(normalizeHeader);
      setColumnMappings([
        {
          field: "Name",
          source:
            headers[normalizedHeaders.indexOf("full_name")] === undefined
              ? "Not matched"
              : String(headers[normalizedHeaders.indexOf("full_name")]),
        },
        {
          field: "Phone",
          source:
            headers[normalizedHeaders.indexOf("phone_e164")] === undefined
              ? "Not matched"
              : String(headers[normalizedHeaders.indexOf("phone_e164")]),
        },
        {
          field: "Email",
          source:
            headers[normalizedHeaders.indexOf("email")] === undefined
              ? "Optional; no column"
              : String(headers[normalizedHeaders.indexOf("email")]),
        },
      ]);
      setRows(result.validRows);
      setInvalidRows(result.invalidRows);
      setStatus(
        `${result.validRows.length} valid rows found; ${result.invalidRows.length} rows skipped.`,
        result.validRows.length === 0
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Could not read the file.",
        true
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
    setImportedTagId("");

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
      `${addedCount} customers imported. ${skipped} invalid or duplicate rows skipped.`
    );
    setBusy(false);
    router.refresh();
  }

  async function handleTagImported() {
    if (!importedTagId || importedIds.length === 0) return;
    const tag = initialTags.find((item) => item.id === importedTagId);
    setTagging(true);

    const { data, error } = await dashboardApiRequest<{
      addedCount: number;
      skippedCount: number;
    }>("/api/dashboard/customers/tags", {
      method: "POST",
      body: { tagId: importedTagId, customerIds: importedIds },
    });

    setTagging(false);
    if (error) {
      setStatus(error, true);
      return;
    }

    const added = data?.addedCount ?? 0;
    setStatus(
      `Tag "${tag?.name ?? ""}" applied to ${added} imported customer${
        added === 1 ? "" : "s"
      }.`
    );
    setImportedTagId("");
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
          Headers: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px]">full_name,phone_e164,email</code> or{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px]">Name,Phone,Email</code>
        </p>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-emerald-400 hover:bg-emerald-50/50">
          <Upload className="size-6 text-slate-400" />
          <span className="text-[13px] font-semibold text-slate-700">Choose a .csv or .xlsx file</span>
          <span className="text-[12px] text-slate-500">Max 2 MB • up to 1,000 rows • E.164 like +8801712345678</span>
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
            isError ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
          )}
        >
          {isError ? <TriangleAlert className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
          {message}
        </p>
      )}

      {showTagging && importedIds.length > 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 sm:p-6">
          <p className="flex items-center gap-2 text-[13px] font-bold text-emerald-900">
            <TagIcon className="size-4" />
            Tag the {importedIds.length} customers you just imported
          </p>
          {initialTags.length === 0 ? (
            <p className="mt-1.5 text-[12px] text-emerald-800/80">
              Create a tag on the Tags page first, then come back to apply it here.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={importedTagId}
                disabled={tagging || busy}
                aria-label="Tag to apply to imported customers"
                onChange={(e) => setImportedTagId(e.target.value)}
                className="h-9 rounded-full border border-emerald-200 bg-white px-3 text-[12px] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:opacity-50"
              >
                <option value="">Choose a tag…</option>
                {initialTags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={tagging || busy || !importedTagId}
                onClick={() => void handleTagImported()}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-[12px] font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
              >
                <TagIcon className="size-3.5" />
                {tagging
                  ? "Applying…"
                  : `Apply tag to ${importedIds.length} customer${importedIds.length === 1 ? "" : "s"}`}
              </button>
              <Link
                href="/dashboard/customers"
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-4 py-2 text-[12px] font-bold text-emerald-800 transition hover:bg-white/80"
              >
                View customers →
              </Link>
            </div>
          )}
        </div>
      )}

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

      {invalidRows.length > 0 && (
        <div
          className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
          role="region"
          aria-label="Invalid rows"
        >
          <h2 className="flex items-center gap-2 text-[13px] font-bold text-amber-800">
            <TriangleAlert className="size-4" />
            Skipped rows
          </h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-[12px] text-amber-800">
            {invalidRows.slice(0, maxDisplayedIssues).map((issue) => (
              <li key={issue.rowNumber}>
                Row {issue.rowNumber}: {issue.reasons.join("; ")}
              </li>
            ))}
          </ul>
          {invalidRows.length > maxDisplayedIssues && (
            <p className="mt-2 text-[12px] text-amber-700">
              {invalidRows.length - maxDisplayedIssues} more invalid rows not shown.
            </p>
          )}
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
            onClick={handleImport}
            disabled={busy}
          >
            <Upload className="size-4" />
            {busy
              ? "Importing..."
              : submitLabel?.(rows.length) ?? `Import ${rows.length} customers`}
          </button>
        </div>
      )}
    </section>
  );
}
