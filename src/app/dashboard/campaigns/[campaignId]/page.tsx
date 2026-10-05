import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader, { HeaderAction } from "@/components/dashboard/page-header";
import CampaignAudienceManager from "@/components/dashboard/campaigns/campaign-details/campaign-audience-manager";
import type { CampaignAudiencePageProps } from "@/types/campaign";

export default async function CampaignAudiencePage({
  params,
}: CampaignAudiencePageProps) {
  const { campaignId } = await params;
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();

  if (authError || !auth?.claims) {
    redirect("/login");
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

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

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, name, message_body, status")
    .eq("id", campaignId)
    .eq("business_id", business.id)
    .maybeSingle();

  if (campaignError) {
    return (
      <div>
        <PageHeader title="Campaign Audience" subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load campaign: {campaignError.message}
        </p>
      </div>
    );
  }

  if (!campaign) {
    notFound();
  }

  const [
    { data: customers, error: customersError },
    { data: recipients, error: recipientsError },
    { data: tags, error: tagsError },
    { data: customerTags, error: customerTagsError },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, phone_e164, email")
      .eq("business_id", business.id)
      .order("full_name", { ascending: true }),
    supabase
      .from("campaign_recipients")
      .select("campaign_id, customer_id")
      .eq("campaign_id", campaign.id),
    supabase
      .from("tags")
      .select("id, name")
      .eq("business_id", business.id)
      .order("name", { ascending: true }),
    supabase
      .from("customer_tags")
      .select("customer_id, tag_id")
      .eq("business_id", business.id),
  ]);

  if (customersError) {
    return (
      <div>
        <PageHeader title={campaign.name} subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load customers: {customersError.message}
        </p>
      </div>
    );
  }

  if (recipientsError) {
    return (
      <div>
        <PageHeader title={campaign.name} subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load audience: {recipientsError.message}
        </p>
      </div>
    );
  }

  if (tagsError) {
    return (
      <div>
        <PageHeader title={campaign.name} subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load tags: {tagsError.message}
        </p>
      </div>
    );
  }

  if (customerTagsError) {
    return (
      <div>
        <PageHeader title={campaign.name} subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load customer tags: {customerTagsError.message}
        </p>
      </div>
    );
  }

  const audienceCount = recipients?.length ?? 0;

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
        initialCustomers={customers ?? []}
        initialRecipients={recipients ?? []}
        initialTags={tags ?? []}
        initialCustomerTags={customerTags ?? []}
      />
    </div>
  );
}
