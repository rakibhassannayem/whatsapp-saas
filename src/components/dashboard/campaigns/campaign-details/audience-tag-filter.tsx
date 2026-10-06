"use client";

import { Check, Tag as TagIcon } from "lucide-react";
import type { CustomerTag, Tag } from "@/types/customer";

interface AudienceTagFilterProps {
  initialTags: Tag[];
  initialCustomerTags: CustomerTag[];
  selectedCustomerIds: Set<string>;
  busy: boolean;
  onToggleTag: (tagId: string, tagName: string) => void;
}

export default function AudienceTagFilter({
  initialTags,
  initialCustomerTags,
  selectedCustomerIds,
  busy,
  onToggleTag,
}: AudienceTagFilterProps) {
  if (initialTags.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <TagIcon className="size-4 text-emerald-600" />
        <h3 className="text-[13px] font-bold text-slate-900">Add by Tag</h3>
      </div>
      <p className="mt-1 text-[12px] text-slate-500">
        Click a tag to add its contacts; click it again when all are selected to remove them.
      </p>

      <div className="mt-3.5 flex flex-wrap gap-2">
        {initialTags.map((tag) => {
          const taggedCustomerIds = initialCustomerTags
            .filter((item) => item.tag_id === tag.id)
            .map((item) => item.customer_id);

          const availableCount = taggedCustomerIds.filter(
            (id) => !selectedCustomerIds.has(id),
          ).length;
          const isAllAdded = taggedCustomerIds.length > 0 && availableCount === 0;

          return (
            <button
              key={tag.id}
              type="button"
              disabled={busy || taggedCustomerIds.length === 0}
              onClick={() => onToggleTag(tag.id, tag.name)}
              aria-label={
                isAllAdded
                  ? `Remove customers with ${tag.name} tag from audience`
                  : `Add customers with ${tag.name} tag to audience`
              }
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-medium transition ${
                isAllAdded
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span>{tag.name}</span>
              {isAllAdded ? (
                <span className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600">
                  <Check className="size-3" /> All in · click to remove
                </span>
              ) : (
                <span className="rounded-full bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                  +{availableCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
