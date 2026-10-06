import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ColumnMapping, ImportRow, InvalidRow } from "@/types/customer-import";

export const phonePattern = /^\+[1-9][0-9]{1,14}$/;
export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const maxFileSize = 2 * 1024 * 1024;
export const maxRows = 1000;

export function normalizeHeader(header: unknown) {
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

export function buildImportRows(
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

export interface ParseResult {
  validRows: ImportRow[];
  invalidRows: InvalidRow[];
  columnMappings: ColumnMapping[];
}

export async function parseImportFile(file: File): Promise<ParseResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension !== "csv" && extension !== "xlsx") {
    throw new Error("Please choose a .csv or .xlsx file.");
  }
  if (file.size > maxFileSize) {
    throw new Error("File must be smaller than 2 MB.");
  }

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
    if (!firstSheet) {
      throw new Error("XLSX file-এ কোনো worksheet পাওয়া যায়নি।");
    }
    const [headerRow = [], ...dataRows] = XLSX.utils.sheet_to_json<unknown[]>(
      firstSheet,
      { header: 1, defval: "", raw: false, blankrows: false },
    );
    headers = headerRow;
    values = dataRows;
  }

  if (values.length > maxRows) {
    throw new Error(`At most ${maxRows} rows can be imported at once.`);
  }

  const result = buildImportRows(headers, values, parserIssues);
  const normalizedHeaders = headers.map(normalizeHeader);
  const columnMappings: ColumnMapping[] = [
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
  ];

  return {
    validRows: result.validRows,
    invalidRows: result.invalidRows,
    columnMappings,
  };
}
