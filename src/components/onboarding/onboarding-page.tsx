"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Check, LoaderCircle, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type CreatedBusiness = { id?: string };

function readCreatedBusinessId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value[0] && typeof value[0] === "object") {
    const id = (value[0] as CreatedBusiness).id;
    return typeof id === "string" ? id : null;
  }
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as CreatedBusiness).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("businessName") ?? "").trim();
    if (!name) {
      setMessage("Please enter a business name.");
      return;
    }

    setMessage("");
    setBusy(true);

    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_business", {
      p_name: name,
    });

    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }

    let businessId = readCreatedBusinessId(data);

    // Older versions of the RPC may return no ID. Find this user's newly
    // created business through their normal, RLS-protected Supabase session.
    if (!businessId) {
      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("name", name)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      businessId = business?.id ?? null;
    }

    if (businessId) {
      const response = await fetch("/api/dashboard/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setMessage(
          `Your business was created, but the dashboard could not switch to it. ${result?.error ?? "Refresh and choose it from the business menu."}`,
        );
        setBusy(false);
        return;
      }
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-36 size-[28rem] rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 size-[30rem] rounded-full bg-teal-100/70 blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl">
        <Link
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          href="/dashboard"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>

        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_80px_-36px_rgba(15,23,42,0.3)]">
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 px-6 py-8 text-white sm:px-9 sm:py-10">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner">
              <Building2 className="size-6" />
            </div>
            <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-emerald-50">
              <Sparkles className="size-3.5" />
              WORKSPACE SETUP
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Create a business
            </h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-emerald-50/90">
              Set up a workspace for your customers, campaigns, and WhatsApp messages.
            </p>
          </div>

          <div className="px-6 py-7 sm:px-9 sm:py-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800">
                  Business name
                </span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
                  name="businessName"
                  placeholder="For example, Acme Store"
                  minLength={1}
                  maxLength={120}
                  autoComplete="organization"
                  required
                  disabled={busy}
                />
                <span className="mt-2 block text-xs leading-5 text-slate-500">
                  You can create more than one business and switch between them from your dashboard.
                </span>
              </label>

              {message && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                  {message}
                </p>
              )}

              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={busy}
              >
                {busy ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Creating your business…
                  </>
                ) : (
                  <>
                    <Check className="size-4" />
                    Create business
                    <ArrowRight className="ml-auto size-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex items-start gap-3 rounded-xl bg-emerald-50/70 p-4">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
                <Check className="size-4" />
              </span>
              <p className="text-xs leading-5 text-slate-600">
                Your account will be connected to this workspace. After creation, it becomes the active business in your dashboard.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
