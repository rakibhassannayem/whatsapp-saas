import { CalendarClock, Gauge, PackageCheck } from "lucide-react";
import PlatformAdminDataNotice from "@/components/platform-admin/platform-admin-data-notice";
import { getPlatformAdminBusinesses } from "@/lib/supabase/platform-admin-data";

export default async function AdminSubscriptionsPage() {
  const result = await getPlatformAdminBusinesses();
  if (result.status !== "authorized") return <PlatformAdminDataNotice />;
  const subscriptions = result.businesses.flatMap((business) =>
    business.subscription ? [{ businessName: business.name, ...business.subscription }] : [],
  );
  const activeCount = subscriptions.filter((item) => item.status === "active").length;
  const noExpiryCount = subscriptions.filter((item) => !item.expiresAt).length;

  const stats = [
    { label: "Active subscriptions", value: result.subscriptionDataAvailable ? activeCount : null, icon: PackageCheck },
    { label: "No expiry date", value: result.subscriptionDataAvailable ? noExpiryCount : null, icon: CalendarClock },
    { label: "With message limits", value: result.subscriptionDataAvailable ? subscriptions.filter((item) => item.monthlyMessageLimit !== null).length : null, icon: Gauge },
  ];

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Plans & renewals</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Subscriptions</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Review each business package, subscription term, and usage limit.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <section key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><p className="text-sm text-slate-500">{label}</p><Icon className="size-5 text-emerald-700" /></div>
            <p className="mt-4 text-3xl font-bold text-slate-950">{value?.toLocaleString() ?? "—"}</p>
          </section>
        ))}
      </div>

      {!result.subscriptionDataAvailable && (
        <div className="mt-6"><PlatformAdminDataNotice title="Subscription tables are not in local PostgreSQL yet" description="Plan terms and usage limits have not been moved into the local database, so this page cannot show subscription details yet." /></div>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Business subscriptions</h2><p className="mt-1 text-xs text-slate-500">Package assignment and expiry details</p></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs text-slate-500">
            <thead className="bg-slate-50 uppercase tracking-wide"><tr>{["Business", "Package", "Period", "Start date", "Expiry", "Customers", "Campaigns", "Monthly messages", "Status"].map((column) => <th key={column} className="px-4 py-3 font-semibold">{column}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td className="px-4 py-4 font-semibold text-slate-800">{subscription.businessName}</td>
                  <td className="px-4 py-4">{subscription.planName}</td>
                  <td className="px-4 py-4 capitalize">{subscription.billingPeriod}</td>
                  <td className="px-4 py-4">{subscription.startsAt.slice(0, 10)}</td>
                  <td className="px-4 py-4">{subscription.expiresAt?.slice(0, 10) ?? "No expiry"}</td>
                  <td className="px-4 py-4">{subscription.customerLimit ?? "—"}</td>
                  <td className="px-4 py-4">{subscription.campaignLimit ?? "—"}</td>
                  <td className="px-4 py-4">{subscription.monthlyMessageLimit ?? "—"}</td>
                  <td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 capitalize">{subscription.status}</span></td>
                </tr>
              ))}
              {result.subscriptionDataAvailable && subscriptions.length === 0 && (
                <tr><td colSpan={9} className="px-5 py-12 text-center"><p className="text-sm font-semibold text-slate-800">No subscription records yet</p><p className="mt-2 text-xs text-slate-500">The database structure is ready, but no plans have been assigned.</p></td></tr>
              )}
              {!result.subscriptionDataAvailable && (
                <tr><td colSpan={9} className="px-5 py-12 text-center text-xs text-slate-500">Subscription records will appear here after the migration is applied.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
