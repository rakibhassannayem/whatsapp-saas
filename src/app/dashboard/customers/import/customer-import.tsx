"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { dashboardApiRequest } from "@/lib/dashboard-api";

type ImportRow = {
  full_name: string;
  phone_e164: string;
  email: string | null;
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

export default function CustomerImporter() {
  const router = useRouter();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [invalidRows, setInvalidRows] = useState<InvalidRow[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setRows([]);
    setInvalidRows([]);
    setColumnMappings([]);
    setMessage("");

    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "csv" && extension !== "xlsx") {
      setMessage("একটি .csv অথবা .xlsx file নির্বাচন করো।");
      return;
    }
    if (file.size > maxFileSize) {
      setMessage("File 2 MB-এর চেয়ে ছোট হতে হবে।");
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
          reasons: [`CSV parse সমস্যা: ${error.message}`],
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
        setMessage(`একবারে সর্বোচ্চ ${maxRows}টি row import করা যাবে।`);
        return;
      }

      const result = buildImportRows(headers, values, parserIssues);
      const normalizedHeaders = headers.map(normalizeHeader);
      setColumnMappings([
        {
          field: "Name",
          source:
            headers[normalizedHeaders.indexOf("full_name")] === undefined
              ? "মেলেনি"
              : String(headers[normalizedHeaders.indexOf("full_name")]),
        },
        {
          field: "Phone",
          source:
            headers[normalizedHeaders.indexOf("phone_e164")] === undefined
              ? "মেলেনি"
              : String(headers[normalizedHeaders.indexOf("phone_e164")]),
        },
        {
          field: "Email",
          source:
            headers[normalizedHeaders.indexOf("email")] === undefined
              ? "ঐচ্ছিক; কোনো column নেই"
              : String(headers[normalizedHeaders.indexOf("email")]),
        },
      ]);
      setRows(result.validRows);
      setInvalidRows(result.invalidRows);
      setMessage(
        `${result.validRows.length}টি valid row পাওয়া গেছে; ${result.invalidRows.length}টি row বাদ গেছে।`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "File পড়তে সমস্যা হয়েছে।",
      );
    }
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setMessage("");
    setBusy(true);

    const { data, error } = await dashboardApiRequest<{ addedCount: number }>(
      "/api/dashboard/customers/import",
      { method: "POST", body: { rows } },
    );

    setBusy(false);
    if (error) {
      setMessage(error);
      return;
    }

    const addedCount = data?.addedCount ?? 0;
    const existingDuplicates = rows.length - addedCount;
    setMessage(
      `${addedCount}টি customer import হয়েছে। ${invalidRows.length + existingDuplicates}টি invalid বা duplicate row বাদ গেছে।`,
    );
    setRows([]);
    router.refresh();
  }

  return (
    <section className="mt-8 space-y-5">
      <div className="rounded border p-4">
        <p className="mb-3">
          CSV বা XLSX header: <code>full_name,phone_e164,email</code> অথবা{" "}
          <code>Name,Phone,Email</code>
        </p>
        <input
          type="file"
          accept=".csv,.xlsx,text/csv"
          onChange={handleFileChange}
        />
        <p className="mt-2 text-sm text-gray-600">
          File সর্বোচ্চ 2 MB; প্রতি import-এ সর্বোচ্চ 1,000 row। Phone E.164
          format-এ দাও, যেমন +8801712345678।
        </p>
      </div>

      {message && <p role="status">{message}</p>}

      {columnMappings.length > 0 && (
        <div className="rounded border p-4">
          <h2 className="font-semibold">Column mapping</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {columnMappings.map(({ field, source }) => (
              <li key={field}>
                {field} ← {source}
              </li>
            ))}
          </ul>
        </div>
      )}

      {invalidRows.length > 0 && (
        <div
          className="rounded border border-amber-300 p-4"
          role="region"
          aria-label="Invalid rows"
        >
          <h2 className="font-semibold">বাদ যাওয়া row-এর কারণ</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
            {invalidRows.slice(0, maxDisplayedIssues).map((issue) => (
              <li key={issue.rowNumber}>
                Row {issue.rowNumber}: {issue.reasons.join("; ")}
              </li>
            ))}
          </ul>
          {invalidRows.length > maxDisplayedIssues && (
            <p className="mt-2 text-sm text-gray-600">
              আরও {invalidRows.length - maxDisplayedIssues}টি invalid row-এর
              কারণ দেখানো হয়নি।
            </p>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded border p-4">
          <h2 className="font-semibold">Preview</h2>
          <p className="mt-1 text-sm">
            Import-এর জন্য {rows.length}টি valid row প্রস্তুত।
          </p>
          <ul className="mt-3 divide-y">
            {rows.slice(0, 5).map((row) => (
              <li className="py-2" key={row.phone_e164}>
                {row.full_name} — {row.phone_e164}
                {row.email ? ` — ${row.email}` : ""}
              </li>
            ))}
          </ul>
          {rows.length > 5 && (
            <p className="mt-2 text-sm text-gray-600">
              Preview-তে প্রথম 5টি row দেখানো হয়েছে।
            </p>
          )}
          <button
            className="mt-4 rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            type="button"
            onClick={handleImport}
            disabled={busy}
          >
            {busy ? "Importing..." : `Import ${rows.length} customers`}
          </button>
        </div>
      )}
    </section>
  );
}
