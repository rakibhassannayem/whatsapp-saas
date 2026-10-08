import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/dashboard/page-header";
import CampaignsManager from "@/components/dashboard/campaigns/campaigns-manager";
import { getActiveDashboardBusiness, getDashboardBusinesses } from "@/lib/supabase/dashboard-business";

export default async function CampaignsPage() {
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
        <PageHeader title="Campaigns" />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load business: {businessError.message}
        </p>
      </div>
    );
  }

  if (!business) {
    return (
      <div>
        <PageHeader
          title="Campaigns"
          subtitle="Create a business to manage campaigns."
        />
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[13px] text-slate-600">
            You need to set up a business before creating campaigns.
          </p>
          <Link
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-[12px] font-bold text-white transition hover:bg-emerald-600"
            href="/onboarding"
          >
            <Plus className="size-4" />
            Create business
          </Link>
        </section>
      </div>
    );
  }

  const { data: templates, error: templatesError } = await supabase
    .from("message_templates")
    .select("id, name, body")
    .eq("business_id", business.id)
    .order("name", { ascending: true });

  if (templatesError) {
    return (
      <div>
        <PageHeader title="Campaigns" subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load templates: {templatesError.message}
        </p>
      </div>
    );
  }

  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("id, name, message_body, status, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (campaignsError) {
    return (
      <div>
        <PageHeader title="Campaigns" subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load campaigns: {campaignsError.message}
        </p>
      </div>
    );
  }

  const campaignIds = (campaigns ?? []).map((campaign) => campaign.id);
  let recipientRows: { campaign_id: string }[] = [];

  if (campaignIds.length > 0) {
    const { data: recipients, error: recipientsError } = await supabase
      .from("campaign_recipients")
      .select("campaign_id")
      .in("campaign_id", campaignIds);

    if (recipientsError) {
      return (
        <div>
          <PageHeader title="Campaigns" subtitle={business.name} />
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
            Could not load audience data: {recipientsError.message}
          </p>
        </div>
      );
    }

    recipientRows = recipients ?? [];
  }

  const recipientCounts = new Map<string, number>();

  for (const recipient of recipientRows) {
    recipientCounts.set(
      recipient.campaign_id,
      (recipientCounts.get(recipient.campaign_id) ?? 0) + 1,
    );
  }

  const campaignsWithAudience = (campaigns ?? []).map((campaign) => ({
    ...campaign,
    audience_count: recipientCounts.get(campaign.id) ?? 0,
  }));

  return (
    <div>
      <PageHeader
        title="Campaigns"
        subtitle={`${business.name} • ${campaigns?.length ?? 0} draft${campaigns?.length === 1 ? "" : "s"}`}
      />
      <CampaignsManager
        initialCampaigns={campaignsWithAudience}
        initialTemplates={templates ?? []}
      />
    </div>
  );
}
