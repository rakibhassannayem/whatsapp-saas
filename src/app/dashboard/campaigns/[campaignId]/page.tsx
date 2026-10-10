import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader, { HeaderAction } from "@/components/dashboard/page-header";
import CampaignAudienceManager from "@/components/dashboard/campaigns/campaign-details/campaign-audience-manager";
import { getActiveDashboardBusiness, getDashboardBusinesses } from "@/lib/supabase/dashboard-business";
import type { CampaignAudiencePageProps } from "@/types/campaign";
import { getBusinessCampaign, getCampaignRecipients } from "@/lib/db/campaign-queries";
import {
  getBusinessCustomerTags,
  getBusinessCustomers,
  getBusinessTags,
} from "@/lib/db/customer-queries";

export default async function CampaignAudiencePage({
  params,
}: CampaignAudiencePageProps) {
  const { campaignId } = await params;
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();

  if (authError || !auth?.claims) {
    redirect("/login");
  }

  const { data: businesses, error: businessError } = await getDashboardBusinesses(supabase);
  const business = await getActiveDashboardBusiness(businesses ?? []);

  if (businessError) {
    return (
      <div>
        <PageHeader title="Campaign Audience" />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load business: {businessError.message}
        </p>
      </div>
    );
  }

  if (!business) {
    redirect("/onboarding");
  }

  let campaign;
  try {
    campaign = await getBusinessCampaign(business.id, campaignId);
  } catch (error) {
    return (
      <div>
        <PageHeader title="Campaign Audience" subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load campaign: {error instanceof Error ? error.message : "Database request failed."}
        </p>
      </div>
    );
  }
  if (!campaign) {
    notFound();
  }

  let customers;
  let recipients;
  let tags;
  let customerTags;
  try {
    [customers, recipients, tags, customerTags] = await Promise.all([
      getBusinessCustomers(business.id, true),
      getCampaignRecipients(campaign.id),
      getBusinessTags(business.id),
      getBusinessCustomerTags(business.id),
    ]);
  } catch (error) {
    return (
      <div>
        <PageHeader title={campaign.name} subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load campaign audience: {error instanceof Error ? error.message : "Database request failed."}
        </p>
      </div>
    );
  }

  const audienceCount = recipients.length;

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/dashboard/campaigns"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition hover:text-slate-700"
        >
          <ArrowLeft className="size-3.5" />
          Back to Campaigns
        </Link>
      </div>

      <PageHeader
        title={campaign.name}
        subtitle={`${business.name} • ${campaign.status ?? "draft"}`}
        actions={
          <HeaderAction href="/dashboard/send-message" variant="secondary">
            <Users className="size-3.5" />
            Go to Send Message
          </HeaderAction>
        }
      />

      {/* Campaign message preview */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-[14px] font-bold text-slate-700">Campaign Message</h2>
        <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-slate-600">
          {campaign.message_body}
        </p>
      </section>

      {/* Audience count summary */}
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <Users className="size-4 text-slate-400" />
        <p className="text-[13px] text-slate-600">
          <span className="font-bold text-slate-950">{audienceCount}</span>{" "}
          {audienceCount === 1 ? "recipient" : "recipients"} selected for this campaign
        </p>
      </div>

      <CampaignAudienceManager
        campaignId={campaign.id}
        initialCustomers={customers}
        initialRecipients={recipients}
        initialTags={tags}
        initialCustomerTags={customerTags}
      />
    </div>
  );
}
