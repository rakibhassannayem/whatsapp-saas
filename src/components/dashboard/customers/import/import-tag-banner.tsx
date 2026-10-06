"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tag as TagIcon } from "lucide-react";
import { dashboardApiRequest } from "@/lib/dashboard-api";

interface ImportTagBannerProps {
  importedIds: string[];
  initialTags: { id: string; name: string }[];
  busy: boolean;
  onStatusChange: (text: string, error?: boolean) => void;
}

export default function ImportTagBanner({
  importedIds,
  initialTags,
  busy,
  onStatusChange,
}: ImportTagBannerProps) {
  const router = useRouter();
  const [importedTagId, setImportedTagId] = useState("");
  const [tagging, setTagging] = useState(false);

  if (importedIds.length === 0) return null;

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
      onStatusChange(error, true);
      return;
    }

    const added = data?.addedCount ?? 0;
    onStatusChange(
      `Tag "${tag?.name ?? ""}" applied to ${added} imported customer${
        added === 1 ? "" : "s"
      }.`,
    );
    setImportedTagId("");
    router.refresh();
  }

  return (
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
  );
}
