"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin-client";

export default function PlatformAdminPasswordSetup() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setBusy(true);
    setError("");
    const { error: updateError } = await createAdminClient().auth.updateUser({
      password,
    });
    if (updateError) {
      setError(updateError.message);
      setBusy(false);
      return;
    }

    const activationResponse = await fetch("/api/platform-admin/admins/activate", {
      method: "POST",
    });
    if (!activationResponse.ok) {
      const result = await activationResponse.json();
      setError(result.error ?? "Your password was saved, but admin setup could not be marked complete.");
      setBusy(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <section className="mt-6 max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        <ShieldCheck className="size-5" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-950">Set your admin password</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        This password is for your separate platform-admin sign-in. It will not change a business-user password.
      </p>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">New password</span>
          <span className="relative block">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              type="password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
            />
          </span>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Confirm password</span>
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
        </label>
        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0a1512] px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={busy}
        >
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          {busy ? "Saving password…" : "Save password and continue"}
        </button>
      </form>
    </section>
  );
}
