"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin-client";

type PlatformAdminAccessScreenProps = {
  mode: "login" | "denied" | "unavailable";
};

export default function PlatformAdminAccessScreen({
  mode,
}: PlatformAdminAccessScreenProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setBusy(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const supabase = createAdminClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage("The email or password is incorrect. Please try again.");
      setBusy(false);
      return;
    }

    const { data: isPlatformAdmin, error: roleError } =
      await supabase.rpc("is_platform_admin");

    if (roleError || isPlatformAdmin !== true) {
      await supabase.auth.signOut();
      setErrorMessage(
        roleError
          ? "Admin access could not be verified. Please try again shortly."
          : "This account is not on the platform admin allowlist.",
      );
      setBusy(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  const title =
    mode === "login"
      ? "Platform Admin sign in"
      : mode === "denied"
        ? "Admin access denied"
        : "Could not verify admin access";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07120f] px-5 py-12 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.18),_transparent_55%)]"
      />
      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0d1b17]/95 p-7 shadow-2xl shadow-black/40 sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Private console
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Platform administration
            </p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {mode === "login"
            ? "Sign in with an authorized platform admin account."
            : mode === "denied"
              ? "This account is not on the private admin allowlist. Use an authorized account to continue."
              : "Supabase could not verify admin access. Check the configuration and try again."}
        </p>

        {mode === "login" && (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Admin email
              </span>
              <input
                className="w-full rounded-xl border border-white/10 bg-[#07120f] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="admin@example.com"
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Password
              </span>
              <span className="relative block">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <input
                  className="w-full rounded-xl border border-white/10 bg-[#07120f] py-3 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  required
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-slate-200"
                  type="button"
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </span>
            </label>
            {errorMessage && (
              <p className="text-sm leading-5 text-rose-300" role="alert">
                {errorMessage}
              </p>
            )}
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-[#062019] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={busy}
            >
              <LockKeyhole className="size-4" />
              {busy ? "Verifying…" : "Continue to admin console"}
              {!busy && <ArrowRight className="size-4" />}
            </button>
          </form>
        )}

        {mode !== "login" && (
          <div className="mt-7 rounded-xl border border-white/10 bg-black/10 p-4 text-sm leading-6 text-slate-400">
            Admin access is verified server-side against the Supabase allowlist.
          </div>
        )}
        <div className="mt-8 border-t border-white/10 pt-5 text-xs text-slate-500">
          Restricted area · Access is checked for every admin session
        </div>
      </section>
    </main>
  );
}
