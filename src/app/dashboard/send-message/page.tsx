import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/dashboard/page-header";
import SendMessageManager from "@/components/dashboard/send-message/send-message-manager";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getActiveDashboardBusiness, getDashboardBusinesses } from "@/lib/supabase/dashboard-business";
import {
  getBusinessCampaignRecipients,
  getBusinessCampaigns,
} from "@/lib/db/campaign-queries";
import {
  getBusinessCustomerTags,
  getBusinessCustomers,
  getBusinessTags,
} from "@/lib/db/customer-queries";

export default async function SendMessagePage() {
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
        <PageHeader title="Send Message" />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load business: {businessError.message}
        </p>
      </div>
    );
  }

  if (!business) {
    return (
      <div>
        <PageHeader title="Send Message" subtitle="Create a business to send message." />
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[13px] text-slate-600">
            You need to set up a business before sending messages.
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

  let campaigns;
  let customers;
  let tags;
  let customerTags;
  let recipients;
  try {
    [campaigns, customers, tags, customerTags, recipients] = await Promise.all([
      getBusinessCampaigns(business.id),
      getBusinessCustomers(business.id, true),
      getBusinessTags(business.id),
      getBusinessCustomerTags(business.id),
      getBusinessCampaignRecipients(business.id),
    ]);
  } catch (error) {
    return (
      <div>
        <PageHeader title="Send Message" subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load message data: {error instanceof Error ? error.message : "Database request failed."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Send Message"
        subtitle={`${business.name} • Select a campaign and audience`}
      />
      <SendMessageManager
        initialCampaigns={campaigns}
        initialCustomers={customers}
        initialRecipients={recipients}
        initialTags={tags}
        initialCustomerTags={customerTags}
      />
    </div>
  );
}
