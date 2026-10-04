import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SendMessageManager from "./send-message-manager";

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
      <main className="p-8">
        Business load করতে সমস্যা: {businessError.message}
      </main>
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
      <main className="p-8">
        Campaigns load করতে সমস্যা: {campaignsError.message}
      </main>
    );
  }

  if (customersError) {
    return (
      <main className="p-8">
        Customers load করতে সমস্যা: {customersError.message}
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

  let recipients: { campaign_id: string; customer_id: string }[] = [];
  const campaignIds = (campaigns ?? []).map((campaign) => campaign.id);

  if (campaignIds.length > 0) {
    const { data, error } = await supabase
      .from("campaign_recipients")
      .select("campaign_id, customer_id")
      .in("campaign_id", campaignIds);

    if (error) {
      return (
        <main className="p-8">
          Audience load করতে সমস্যা: {error.message}
        </main>
      );
    }

    recipients = data ?? [];
  }

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8">
      <h1 className="text-2xl font-semibold">Send message</h1>
      <p className="mt-1 text-gray-600">{business.name}</p>

      <SendMessageManager
        initialCampaigns={campaigns ?? []}
        initialCustomers={customers ?? []}
        initialRecipients={recipients}
        initialTags={tags ?? []}
        initialCustomerTags={customerTags ?? []}
      />
    </main>
  );
}
