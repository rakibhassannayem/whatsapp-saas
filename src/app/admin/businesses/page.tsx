import PlatformAdminDataNotice from "@/components/platform-admin/platform-admin-data-notice";
import PlatformAdminOwnerList, {
  type PlatformAdminOwnerSummary,
} from "@/components/platform-admin/platform-admin-owner-list";
import { getPlatformAdminBusinesses } from "@/lib/supabase/platform-admin-data";

export default async function AdminBusinessesPage() {
  const result = await getPlatformAdminBusinesses();
  if (result.status !== "authorized") return <PlatformAdminDataNotice />;

  const ownersById = new Map<string, PlatformAdminOwnerSummary>();
  for (const business of result.businesses) {
    if (!business.ownerUserId || !business.owner) continue;
    const summary = ownersById.get(business.ownerUserId);
    if (summary) {
      summary.businessCount += 1;
    } else {
      ownersById.set(business.ownerUserId, {
        owner: business.owner,
        businessCount: 1,
      });
    }
  }
  const owners = [...ownersById.values()].sort((a, b) =>
    (a.owner.fullName ?? a.owner.email ?? "").localeCompare(
      b.owner.fullName ?? b.owner.email ?? "",
    ),
  );

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Tenant management</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Business & owners</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Start with the owner list. Open an owner to review their businesses, account, and business details.
      </p>
      <PlatformAdminOwnerList owners={owners} />
    </div>
  );
}
