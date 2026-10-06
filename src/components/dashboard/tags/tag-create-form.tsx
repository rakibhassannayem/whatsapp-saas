"use client";

import type { FormEvent } from "react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import { showToast } from "@/components/ui/toast";
import type { Tag } from "@/types/customer";

interface TagCreateFormProps {
  busy: boolean;
  setBusy: (busy: boolean) => void;
  onTagCreated: (tag: Tag) => void;
}

export default function TagCreateForm({
  busy,
  setBusy,
  onTagCreated,
}: TagCreateFormProps) {
  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();

    if (!name) return;

    setBusy(true);

    const { data, error } = await dashboardApiRequest<Tag>(
      "/api/dashboard/tags",
      { method: "POST", body: { name } },
    );

    setBusy(false);

    if (error || !data) {
      showToast("Could not create tag", error ?? "Tag তৈরি করা যায়নি।", "error");
      return;
    }

    onTagCreated(data);
    showToast("Tag created", "Tag তৈরি হয়েছে।");
    form.reset();
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-[15px] font-bold text-slate-950">
        Create a New Tag
      </h2>
      <p className="mt-1 text-[13px] text-slate-500">
        Use tags to group customers — for example &quot;VIP&quot;, &quot;New
        Customer&quot;, or &quot;Inactive&quot;.
      </p>

      <form
        className="mt-5 flex flex-col gap-3 sm:flex-row"
        onSubmit={handleCreate}
      >
        <label className="sr-only" htmlFor="tag-name">
          Tag name
        </label>
        <input
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[13px] outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          id="tag-name"
          name="name"
          placeholder="e.g. VIP, New Customer"
          maxLength={50}
          required
        />

        <button
          className="rounded-full bg-emerald-500 px-5 py-2 text-[13px] font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
          type="submit"
          disabled={busy}
        >
          {busy ? "Saving…" : "Create tag"}
        </button>
      </form>
    </section>
  );
}
