"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { ownerId: string; ownerEmail: string | null };

export default function PlatformAdminRemoveOwner({ ownerId, ownerEmail }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canConfirm = Boolean(ownerEmail) && confirmation.trim() === ownerEmail;

  async function removeOwner() {
    if (!canConfirm || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/platform-admin/owners", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, confirmation }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not remove owner.");
      router.replace("/admin/businesses");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove owner.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
        type="button"
        onClick={() => { setIsOpen(true); setError(""); }}
      >
        Remove owner and all data
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
          <section
            aria-labelledby="remove-owner-title"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            role="dialog"
          >
            <h2 id="remove-owner-title" className="text-lg font-bold text-slate-950">Permanently remove this owner?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This permanently deletes the owner account, all businesses they created, and related customers, tags, campaigns, templates, memberships, and subscription/payment records. This cannot be undone.
            </p>
            <label className="mt-5 block text-sm font-medium text-slate-800">
              Type the owner’s email to confirm: <span className="font-semibold">{ownerEmail ?? "Email unavailable"}</span>
              <input
                autoComplete="off"
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                disabled={!ownerEmail || busy}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </label>
            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
                disabled={busy}
                onClick={() => { setIsOpen(false); setConfirmation(""); }}
                type="button"
              >Cancel</button>
              <button
                className="rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canConfirm || busy}
                onClick={removeOwner}
                type="button"
              >{busy ? "Removing…" : "Permanently remove"}</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
