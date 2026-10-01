import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CampaignAudienceManager from "./campaign-audience-manager";

type CampaignAudiencePageProps = {
  params: Promise<{ campaignId: string }>;
};

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
      <main className="p-8">
        Business load করতে সমস্যা: {businessError.message}
      </main>
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
      <main className="p-8">
        Campaign load করতে সমস্যা: {campaignError.message}
      </main>
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
      <main className="p-8">
        Customers load করতে সমস্যা: {customersError.message}
      </main>
    );
  }

  if (recipientsError) {
    return (
      <main className="p-8">
        Audience load করতে সমস্যা: {recipientsError.message}
      </main>
    );
  }

  if (tagsError) {
    return (
      <main className="p-8">Tags load করতে সমস্যা: {tagsError.message}</main>
    );
  }

  if (customerTagsError) {
    return (
      <main className="p-8">
        Customer tags load করতে সমস্যা: {customerTagsError.message}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8">
      <Link className="text-sm underline" href="/dashboard/campaigns">
        ← Campaigns
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">{campaign.name}</h1>
      <p className="mt-1 text-gray-600">
        {business.name} · {campaign.status}
      </p>

      <section className="mt-6 rounded-lg border bg-white p-4">
        <h2 className="font-medium">Campaign message</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
          {campaign.message_body}
        </p>
      </section>

      <CampaignAudienceManager
        campaignId={campaign.id}
        initialCustomers={customers ?? []}
        initialRecipients={recipients ?? []}
        initialTags={tags ?? []}
        initialCustomerTags={customerTags ?? []}
      />
    </main>
  );
}
