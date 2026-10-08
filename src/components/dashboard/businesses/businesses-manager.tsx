"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, LoaderCircle, Pencil, Trash2, X } from "lucide-react";

type Business = { id: string; name: string; created_at: string };

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

export default function BusinessesManager({
  initialBusinesses,
  activeBusinessId,
}: {
  initialBusinesses: Business[];
  activeBusinessId: string | null;
}) {
  const router = useRouter();
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function renameBusiness(event: FormEvent<HTMLFormElement>, businessId: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("businessName") ?? "").trim();
    if (!name || name.length > 120) {
      setError("Business name must be between 1 and 120 characters.");
      return;
    }

    setBusyId(businessId);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/dashboard/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, name }),
      });
      const result = (await response.json()) as {
        business?: Business;
        error?: string;
      };
      if (!response.ok || !result.business) {
        throw new Error(result.error || "Could not update this business.");
      }
      setBusinesses((current) =>
        current.map((business) =>
          business.id === businessId ? result.business! : business,
        ),
      );
      setEditingId(null);
      setNotice("Business name updated.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this business.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteBusiness(business: Business) {
    const confirmed = window.confirm(
      `Delete “${business.name}”? This cannot be undone. Related records may also be deleted if the database is configured to cascade; active subscription or payment records may block deletion.`,
    );
    if (!confirmed) return;

    setBusyId(business.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/dashboard/business", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not delete this business.");

      setBusinesses((current) => current.filter((item) => item.id !== business.id));
      setNotice(`“${business.name}” was deleted.`);
      setEditingId(null);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this business.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </p>
      )}

      {businesses.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Building2 className="size-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold text-slate-900">No businesses yet</h2>
          <p className="mt-1 text-sm text-slate-500">Create a business to start using your dashboard.</p>
        </section>
      ) : (
        businesses.map((business) => {
          const isEditing = editingId === business.id;
          const isBusy = busyId === business.id;
          const isActive = activeBusinessId === business.id;

          return (
            <article
              key={business.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Building2 className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-semibold text-slate-950">{business.name}</h2>
                      {isActive && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Created {formatDate(business.created_at)}</p>
                  </div>
                </div>

                {!isEditing && (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setNotice("");
                        setEditingId(business.id);
                      }}
                      disabled={busyId !== null}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Pencil className="size-3.5" />
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteBusiness(business)}
                      disabled={busyId !== null}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {isBusy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {isEditing && (
                <form
                  className="mt-5 border-t border-slate-100 pt-5"
                  onSubmit={(event) => void renameBusiness(event, business.id)}
                >
                  <label className="block max-w-xl">
                    <span className="mb-2 block text-xs font-semibold text-slate-700">Business name</span>
                    <input
                      autoFocus
                      name="businessName"
                      defaultValue={business.name}
                      maxLength={120}
                      required
                      disabled={isBusy}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                    />
                  </label>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isBusy}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {isBusy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                      Save name
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                    >
                      <X className="size-3.5" />
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </article>
          );
        })
      )}
    </div>
  );
}
