"use client";

import { TriangleAlert } from "lucide-react";
import type { InvalidRow } from "@/types/customer-import";

const MAX_DISPLAYED_ISSUES = 20;

interface ImportIssuesCardProps {
  invalidRows: InvalidRow[];
}

export default function ImportIssuesCard({ invalidRows }: ImportIssuesCardProps) {
  if (invalidRows.length === 0) return null;

  return (
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
        {invalidRows.slice(0, MAX_DISPLAYED_ISSUES).map((issue) => (
          <li key={issue.rowNumber}>
            Row {issue.rowNumber}: {issue.reasons.join("; ")}
          </li>
        ))}
      </ul>
      {invalidRows.length > MAX_DISPLAYED_ISSUES && (
        <p className="mt-2 text-[12px] text-amber-700">
          {invalidRows.length - MAX_DISPLAYED_ISSUES} more invalid rows not shown.
        </p>
      )}
    </div>
  );
}
