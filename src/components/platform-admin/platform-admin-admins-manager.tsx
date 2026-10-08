"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, MailPlus, ShieldCheck, Trash2, UserRound } from "lucide-react";
import type { PlatformAdminAccount } from "@/types/platform-admin";

export default function PlatformAdminAdminsManager({
  initialAccounts,
  currentUserId,
}: {
  initialAccounts: PlatformAdminAccount[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<PlatformAdminAccount | null>(null);
  const [confirmation, setConfirmation] = useState("");

  async function removeAdmin() {
    if (!removeTarget?.email || confirmation.trim() !== removeTarget.email) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/platform-admin/admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: removeTarget.id }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not remove admin access.");
      setMessage({ text: `Admin access removed for ${removeTarget.email}. Their account and business data were not deleted.`, error: false });
      setRemoveTarget(null);
      setConfirmation("");
      router.refresh();
    } catch (cause) {
      setMessage({ text: cause instanceof Error ? cause.message : "Could not remove admin access.", error: true });
    } finally {
      setBusy(false);
    }
  }

  async function inviteAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/platform-admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as {
        action?: "invited" | "promoted" | "setup-email-sent";
        error?: string;
      };
      if (!response.ok) throw new Error(result.error || "Could not grant admin access.");

      form.reset();
      setMessage({
        error: false,
        text:
          result.action === "invited"
            ? `Invitation sent to ${email}. They can accept it and set their admin password from the email link.`
            : result.action === "setup-email-sent"
              ? `This account already exists and has admin access. A password setup email was sent to ${email}.`
              : `Admin access granted to ${email}. They can sign in with their existing password at the separate admin login page.`,
      });
      router.refresh();
    } catch (cause) {
      setMessage({
        error: true,
        text: cause instanceof Error ? cause.message : "Could not grant admin access.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <MailPlus className="size-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-950">Add a platform admin</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Enter their email. If an account already exists, it will be promoted. Otherwise, Supabase will create an invited account and email them a secure setup link. Public signup is not needed.
            </p>
          </div>
        </div>

        <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={inviteAdmin}>
          <label className="min-w-0 flex-1">
            <span className="sr-only">Admin email address</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
              required
              maxLength={254}
              disabled={busy}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0a1512] px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            {busy ? "Adding admin…" : "Grant admin access"}
          </button>
        </form>

        {message && (
          <p
            role={message.error ? "alert" : "status"}
            className={`mt-4 rounded-xl px-4 py-3 text-sm leading-5 ${
              message.error
                ? "border border-red-200 bg-red-50 text-red-700"
                : "border border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {message.text}
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-slate-950">Current platform admins</h2>
          <p className="mt-1 text-sm text-slate-500">Only accounts on the private allowlist can open the admin console.</p>
        </div>
        {initialAccounts.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">No platform admins found.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {initialAccounts.map((account) => (
              <li key={account.id} className="flex flex-wrap items-center gap-3 px-5 py-4 sm:flex-nowrap sm:px-6">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <UserRound className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{account.email ?? "Email unavailable"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Added {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(account.createdAt))}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    account.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : account.status === "suspended"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-sky-50 text-sky-700"
                  }`}
                >
                  {account.status === "invitation pending" ? "Invitation pending" : account.status}
                </span>
                {account.id !== currentUserId && (
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                    disabled={busy}
                    onClick={() => { setRemoveTarget(account); setConfirmation(""); setMessage(null); }}
                    type="button"
                  >
                    <Trash2 className="size-3.5" /> Remove access
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <section
            aria-labelledby="remove-admin-title"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            role="dialog"
          >
            <h2 id="remove-admin-title" className="text-lg font-bold text-slate-950">Remove platform-admin access?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This removes <strong>{removeTarget.email}</strong> from the private admin allowlist. Their Auth account and business data will remain. The last remaining platform admin cannot be removed.
            </p>
            <label className="mt-5 block text-sm font-medium text-slate-800">
              Type their email to confirm
              <input
                autoComplete="off"
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                disabled={busy}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
                disabled={busy}
                onClick={() => { setRemoveTarget(null); setConfirmation(""); }}
                type="button"
              >Cancel</button>
              <button
                className="rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={busy || !removeTarget.email || confirmation.trim() !== removeTarget.email}
                onClick={removeAdmin}
                type="button"
              >{busy ? "Removing…" : "Remove admin access"}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
