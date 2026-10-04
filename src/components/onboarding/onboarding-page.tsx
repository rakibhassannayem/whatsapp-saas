"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("businessName") ?? "").trim();

    setMessage("");
    setBusy(true);

    const supabase = createClient();
    const { error } = await supabase.rpc("create_business", {
      p_name: name,
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-2 text-2xl font-semibold">Create your business</h1>
      <p className="mb-6 text-sm text-gray-600">
        Business-এর নাম দাও। তুমি এর owner হবে।
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1 block">Business name</span>
          <input
            className="w-full rounded border p-2"
            name="businessName"
            minLength={1}
            maxLength={120}
            required
          />
        </label>

        <button
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          type="submit"
          disabled={busy}
        >
          {busy ? "Creating..." : "Create business"}
        </button>
      </form>

      {message && <p className="mt-4 text-sm">{message}</p>}
    </main>
  );
}
