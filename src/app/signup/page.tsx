"use client";

import { useState, type FormEvent } from "react";
import AuthAwareLink from "@/components/common/auth-aware-link";
import { Eye, EyeOff, Lock, Mail, UserRound, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "@/components/auth/auth-shell";
import { showToast } from "@/components/ui/toast";

export default function SignupPage() {
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

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
      showToast("Sign-up failed", error.message, "error");
      return;
    }

    showToast(
      "Account created",
      "Open your email and click the confirmation link, then log in to send your first broadcast.",
      "success",
    );
    form.reset();
  }

  return (
    <AuthShell
      title="Start broadcasting today"
      subtitle="Create your free account — import your customer list and send one Eid offer to everyone at once."
      footer={
        <>
          Already have an account?{" "}
          <AuthAwareLink href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Log in
          </AuthAwareLink>{" "}
          to continue broadcasting.
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Full name</span>
          <span className="relative block">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-[14px] outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              name="fullName"
              autoComplete="name"
              placeholder="e.g. Rahim Uddin"
              required
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Email</span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-[14px] outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@shop.com"
              required
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Password</span>
          <span className="relative block">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-11 text-[14px] outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              placeholder="Min. 8 characters"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </span>
        </label>

        <button
          className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
          type="submit"
          disabled={busy}
        >
          <UserPlus className="size-4" />
          {busy ? "Creating account..." : "Sign up & Start Broadcast"}
        </button>
      </form>

    </AuthShell>
  );
}
