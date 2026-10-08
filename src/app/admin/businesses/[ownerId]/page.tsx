import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import PlatformAdminDataNotice from "@/components/platform-admin/platform-admin-data-notice";
import PlatformAdminManager from "@/components/platform-admin/platform-admin-manager";
import PlatformAdminRemoveOwner from "@/components/platform-admin/platform-admin-remove-owner";
import { getPlatformAdminBusinesses } from "@/lib/supabase/platform-admin-data";

export default async function AdminBusinessOwnerPage({
  params,
}: {
  params: Promise<{ ownerId: string }>;
}) {
  const { ownerId } = await params;
  const result = await getPlatformAdminBusinesses();
  if (result.status !== "authorized") return <PlatformAdminDataNotice />;

  const businesses = result.businesses.filter(
    (business) => business.ownerUserId === ownerId,
  );
  const owner = businesses.find((business) => business.owner)?.owner;

  if (!owner) {
    return (
      <div>
        <Link
          href="/admin/businesses"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
        >
          <ArrowLeft className="size-4" />
          Back to owners
        </Link>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          This owner or their businesses could not be found.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/businesses"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
      >
        <ArrowLeft className="size-4" />
        Back to owners
      </Link>

      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-lg font-bold text-emerald-800">
              {(owner.fullName?.[0] ?? owner.email?.[0] ?? "U").toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Business owner
              </p>
              <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-slate-950">
                {owner.fullName || "Name not provided"}
              </h1>
              <p className="mt-1 truncate text-sm text-slate-500">
                {owner.email || "Email unavailable"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
              <Building2 className="size-4" />
            </span>
            <div>
              <p className="text-lg font-bold leading-5 text-slate-950">{businesses.length}</p>
              <p className="mt-1 text-xs text-slate-500">
                {businesses.length === 1 ? "Business" : "Businesses"}
              </p>
            </div>
            <span
              className={`ml-2 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                owner.status === "suspended"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {owner.status === "suspended" ? "Suspended" : "Active"}
            </span>
          </div>
          <PlatformAdminRemoveOwner ownerId={owner.id} ownerEmail={owner.email} />
        </div>
      </section>

      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-950">Business details</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review each business, its users, usage summary, subscription, and payment history.
          </p>
        </div>
        <PlatformAdminManager
          businesses={businesses}
          subscriptionDataAvailable={result.subscriptionDataAvailable}
        />
      </div>
    </div>
  );
}
