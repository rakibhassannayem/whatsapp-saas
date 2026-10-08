import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Building2,
  ContactRound,
  UsersRound,
} from "lucide-react";
import PlatformAdminDataNotice from "@/components/platform-admin/platform-admin-data-notice";
import { getPlatformAdminBusinesses } from "@/lib/supabase/platform-admin-data";

export default async function PlatformAdminPage() {
  const result = await getPlatformAdminBusinesses();
  if (result.status !== "authorized") return <PlatformAdminDataNotice />;

  const customerCount = result.businesses.reduce((sum, business) => sum + business.customerCount, 0);
  const campaignCount = result.businesses.reduce((sum, business) => sum + business.campaigns.length, 0);
  const ownerCount = new Set(result.businesses.flatMap((business) => business.users.filter((user) => user.role === "business_user").map((user) => user.id))).size;
  const stats = [
    { label: "মোট business", value: result.businesses.length, icon: Building2, color: "bg-emerald-50 text-emerald-700" },
    { label: "Business user", value: ownerCount, icon: UsersRound, color: "bg-violet-50 text-violet-700" },
    { label: "Customer records", value: customerCount, icon: ContactRound, color: "bg-sky-50 text-sky-700" },
    { label: "Campaign", value: campaignCount, icon: Activity, color: "bg-amber-50 text-amber-700" },
  ];

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Platform overview</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Admin dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">Business, owners এবং campaign-এর সার্বিক অবস্থা।</p>
        </div>
        <Link href="/admin/businesses" className="inline-flex items-center gap-2 rounded-xl bg-[#0a1512] px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
          Business list দেখুন <ArrowUpRight className="size-4" />
        </Link>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <section key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02]">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <span className={`flex size-10 items-center justify-center rounded-xl ${color}`}><Icon className="size-5" /></span>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{value.toLocaleString()}</p>
          </section>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="font-semibold text-slate-950">Recent business</h2><p className="mt-1 text-sm text-slate-500">সর্বশেষ তৈরি হওয়া business workspace</p></div>
            <Link href="/admin/businesses" className="text-sm font-semibold text-emerald-700">সবগুলো দেখুন</Link>
          </div>
          {result.businesses.length === 0 ? (
            <p className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">এখনো business তৈরি হয়নি।</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {result.businesses.slice(0, 5).map((business) => (
                <li key={business.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{business.name}</p><p className="mt-1 text-xs text-slate-500">{business.users[0]?.email ?? "Owner email নেই"}</p></div>
                  <span className="shrink-0 text-xs text-slate-500">{business.customerCount.toLocaleString()} customers</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold text-slate-950">Platform health & billing</h2>
          <p className="mt-1 text-sm text-slate-500">যে tracking এখনো যুক্ত হয়নি</p>
          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-950">Sent message analytics</p><p className="mt-1 text-xs leading-5 text-amber-900/70">Message delivery log নেই, তাই পাঠানো message-এর সংখ্যা গণনা করা যাচ্ছে না।</p></div>
            <Link href="/admin/subscriptions" className="block rounded-xl border border-slate-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"><p className="text-sm font-semibold text-slate-800">Subscription overview <ArrowUpRight className="ml-1 inline size-3.5" /></p><p className="mt-1 text-xs text-slate-500">Plan, expiry ও usage limit-এর কাঠামো</p></Link>
            <Link href="/admin/billing" className="block rounded-xl border border-slate-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"><p className="text-sm font-semibold text-slate-800">Payment history <ArrowUpRight className="ml-1 inline size-3.5" /></p><p className="mt-1 text-xs text-slate-500">Payment integration ছাড়া history এখানে ফাঁকা থাকবে</p></Link>
          </div>
        </section>
      </div>
    </div>
  );
}
