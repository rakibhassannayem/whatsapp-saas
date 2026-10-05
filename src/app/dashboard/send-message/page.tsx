import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/dashboard/page-header";
import SendMessageManager from "@/components/dashboard/send-message/send-message-manager";

export default async function SendMessagePage() {
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
        <PageHeader title="Send Message" />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load business: {businessError.message}
        </p>
      </div>
    );
  }

  if (!business) {
    redirect("/onboarding");
  }

  const [
    { data: campaigns, error: campaignsError },
    { data: customers, error: customersError },
    { data: tags, error: tagsError },
    { data: customerTags, error: customerTagsError },
  ] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name, message_body, status")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("customers")
      .select("id, full_name, phone_e164, email")
      .eq("business_id", business.id)
      .order("full_name", { ascending: true }),
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

  if (campaignsError) {
    return (
      <div>
        <PageHeader title="Send Message" subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load campaigns: {campaignsError.message}
        </p>
      </div>
    );
  }

  if (customersError) {
    return (
      <div>
        <PageHeader title="Send Message" subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load customers: {customersError.message}
        </p>
      </div>
    );
  }

  if (tagsError) {
    return (
      <div>
        <PageHeader title="Send Message" subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load tags: {tagsError.message}
        </p>
      </div>
    );
  }

  if (customerTagsError) {
    return (
      <div>
        <PageHeader title="Send Message" subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load customer tags: {customerTagsError.message}
        </p>
      </div>
    );
  }

  let recipients: { campaign_id: string; customer_id: string }[] = [];
  const campaignIds = (campaigns ?? []).map((campaign) => campaign.id);

  if (campaignIds.length > 0) {
    const { data, error } = await supabase
      .from("campaign_recipients")
      .select("campaign_id, customer_id")
      .in("campaign_id", campaignIds);

    if (error) {
      return (
        <div>
          <PageHeader title="Send Message" subtitle={business.name} />
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
            Could not load audience: {error.message}
          </p>
        </div>
      );
    }

    recipients = data ?? [];
  }

  return (
    <div>
      <PageHeader
        title="Send Message"
        subtitle={`${business.name} • Select a campaign and audience`}
      />
      <SendMessageManager
        initialCampaigns={campaigns ?? []}
        initialCustomers={customers ?? []}
        initialRecipients={recipients}
        initialTags={tags ?? []}
        initialCustomerTags={customerTags ?? []}
      />
    </div>
  );
}
