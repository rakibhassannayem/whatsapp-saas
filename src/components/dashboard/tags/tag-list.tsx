"use client";

import type { Tag } from "@/types/customer";

interface TagListProps {
  tags: Tag[];
  busy: boolean;
  onDeleteTag: (tag: Tag) => void;
}

export default function TagList({ tags, busy, onDeleteTag }: TagListProps) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">All Tags</h2>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
          {tags.length}
        </span>
      </div>

      {tags.length === 0 ? (
        <p className="rounded-xl border bg-white p-5 text-gray-600">
          NO tags created yet.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <li
              className="flex items-center justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm"
              key={tag.id}
            >
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
                {tag.name}
              </span>

              <button
                className="rounded-md border border-red-200 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                type="button"
                onClick={() => onDeleteTag(tag)}
                disabled={busy}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
