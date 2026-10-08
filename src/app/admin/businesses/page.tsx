import PlatformAdminDataNotice from "@/components/platform-admin/platform-admin-data-notice";
import PlatformAdminManager from "@/components/platform-admin/platform-admin-manager";
import { getPlatformAdminBusinesses } from "@/lib/supabase/platform-admin-data";

export default async function AdminBusinessesPage() {
  const result = await getPlatformAdminBusinesses();
  if (result.status !== "authorized") return <PlatformAdminDataNotice />;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Tenant management</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Business & owners</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Business-এর customer ও campaign-এর aggregate তথ্য এবং owner account দেখো। Customer-এর ব্যক্তিগত তথ্য এই তালিকায় পাঠানো হয় না।
      </p>
      <PlatformAdminManager
        businesses={result.businesses}
        subscriptionDataAvailable={result.subscriptionDataAvailable}
      />
    </div>
  );
}
