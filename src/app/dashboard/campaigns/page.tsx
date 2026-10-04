import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CampaignsManager from "@/components/dashboard/campaigns/campaigns-manager";

export default async function CampaignsPage() {
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
      <main className="p-8">
        Business load করতে সমস্যা: {businessError.message}
      </main>
    );
  }

  if (!business) {
    return (
      <main className="p-8">
        <p>আগে একটি business তৈরি করতে হবে।</p>
        <Link className="mt-3 inline-block underline" href="/onboarding">
          Business তৈরি করো
        </Link>
      </main>
    );
  }

  const { data: templates, error: templatesError } = await supabase
    .from("message_templates")
    .select("id, name, body")
    .eq("business_id", business.id)
    .order("name", { ascending: true });

  if (templatesError) {
    return (
      <main className="p-8">
        Templates load করতে সমস্যা: {templatesError.message}
      </main>
    );
  }

  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("id, name, message_body, status, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (campaignsError) {
    return (
      <main className="p-8">
        Campaigns load করতে সমস্যা: {campaignsError.message}
      </main>
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
        <main className="p-8">
          Audience count load করতে সমস্যা: {recipientsError.message}
        </main>
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
    <main className="mx-auto max-w-6xl p-6 sm:p-8">
      <h1 className="text-2xl font-semibold">Campaigns</h1>
      <p className="mt-1 text-gray-600">{business.name}</p>

      <CampaignsManager
        initialCampaigns={campaignsWithAudience}
        initialTemplates={templates ?? []}
      />
    </main>
  );
}
