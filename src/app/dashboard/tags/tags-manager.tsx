"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Tag = {
  id: string;
  name: string;
  created_at: string;
};

type TagsManagerProps = {
  businessId: string;
  initialTags: Tag[];
};

export default function TagsManager({
  businessId,
  initialTags,
}: TagsManagerProps) {
  const [tags, setTags] = useState(initialTags);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();

    setMessage("");
    setBusy(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("tags")
      .insert({
        business_id: businessId,
        name,
      })
      .select("id, name, created_at")
      .single();

    setBusy(false);

    if (error) {
      if (error.code === "23505") {
        setMessage("এই নামে tag ইতিমধ্যে আছে।");
      } else {
        setMessage(error.message);
      }
      return;
    }

    setTags((current) =>
      [...current, data as Tag].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setMessage("Tag তৈরি হয়েছে।");
    form.reset();
  }

  async function handleDelete(tag: Tag) {
    const confirmed = window.confirm(
      `"${tag.name}" tag delete হবে এবং customer-দের সঙ্গে এর সংযোগও মুছে যাবে।`,
    );

    if (!confirmed) return;

    setMessage("");
    setBusy(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("tags")
      .delete()
      .eq("id", tag.id)
      .eq("business_id", businessId);

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setTags((current) => current.filter((item) => item.id !== tag.id));
    setMessage("Tag delete হয়েছে।");
  }

  return (
    <>
      <section className="mt-8 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">নতুন tag তৈরি করো</h2>
        <p className="mt-1 text-sm text-gray-600">
          Customer-দের পরে চেনার জন্য tag ব্যবহার করো, যেমন VIP বা নতুন ক্রেতা।
        </p>

        <form
          className="mt-5 flex flex-col gap-3 sm:flex-row"
          onSubmit={handleCreate}
        >
          <label className="sr-only" htmlFor="tag-name">
            Tag-এর নাম
          </label>
          <input
            className="min-w-0 flex-1 rounded-md border p-2"
            id="tag-name"
            name="name"
            placeholder="যেমন: VIP"
            maxLength={50}
            required
          />

          <button
            className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
            type="submit"
            disabled={busy}
          >
            {busy ? "Saving..." : "Create tag"}
          </button>
        </form>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">তোমার tags</h2>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
            {tags.length}
          </span>
        </div>

        {tags.length === 0 ? (
          <p className="rounded-xl border bg-white p-5 text-gray-600">
            এখনো কোনো tag তৈরি করা হয়নি। উপরের form দিয়ে প্রথম tag তৈরি করো।
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
                  onClick={() => handleDelete(tag)}
                  disabled={busy}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {message && (
        <p
          className="mt-4 rounded-md border bg-white p-3 text-sm"
          role="status"
        >
          {message}
        </p>
      )}
    </>
  );
}
