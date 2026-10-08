import { Activity, Megaphone } from "lucide-react";
import PlatformAdminDataNotice from "@/components/platform-admin/platform-admin-data-notice";
import { getPlatformAdminBusinesses } from "@/lib/supabase/platform-admin-data";

export default async function AdminCampaignsPage() {
  const result = await getPlatformAdminBusinesses();
  if (result.status !== "authorized") return <PlatformAdminDataNotice />;

  const campaigns = result.businesses.flatMap((business) =>
    business.campaigns.map((campaign) => ({ ...campaign, businessName: business.name })),
  );

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Usage activity</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Campaign activity</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Review campaign names, businesses, status, and audience size. Message bodies and customer contact details are not shown here.</p>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-semibold text-slate-900">All campaigns <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{campaigns.length}</span></h2>
            <p className="mt-1 text-xs text-slate-500">Audience size is not the same as messages sent.</p>
          </div>
          <Megaphone className="size-5 text-emerald-600" />
        </div>
        {campaigns.length === 0 ? (
          <div className="p-10 text-center">
            <Activity className="mx-auto size-7 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-800">No campaigns yet</p>
            <p className="mt-1 text-xs text-slate-500">Campaigns will appear here after a business owner creates one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3 font-semibold">Campaign</th><th className="px-5 py-3 font-semibold">Business</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Audience</th><th className="px-5 py-3 font-semibold">Created</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-semibold text-slate-800">{campaign.name}</td>
                    <td className="px-5 py-4 text-slate-600">{campaign.businessName}</td>
                    <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-600">{campaign.status}</span></td>
                    <td className="px-5 py-4 text-slate-600">{campaign.audienceCount.toLocaleString()}</td>
                    <td className="px-5 py-4 text-slate-500">{campaign.createdAt.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
        The current database stores campaigns and audience selections, but not delivery logs for messages sent through Meta. Sent and delivered totals are not estimated.
      </p>
    </div>
  );
}
