"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setMessage("");
    setBusy(true);

    const fullName = String(formData.get("fullName") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Signup হয়েছে। Email খুলে confirmation link-এ click করো।");
    form.reset();
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-2xl font-semibold">Create an account</h1>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1 block">Full name</span>
          <input
            className="w-full rounded border p-2"
            name="fullName"
            autoComplete="name"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block">Email</span>
          <input
            className="w-full rounded border p-2"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block">Password</span>
          <input
            className="w-full rounded border p-2"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        <button
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          type="submit"
          disabled={busy}
        >
          {busy ? "Creating account..." : "Sign up"}
        </button>
      </form>

      {message && <p className="mt-4">{message}</p>}
    </main>
  );
}
