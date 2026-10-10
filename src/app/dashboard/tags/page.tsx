import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/dashboard/page-header";
import TagsManager from "@/components/dashboard/tags/tags-manager";
import { getActiveDashboardBusiness, getDashboardBusinesses } from "@/lib/supabase/dashboard-business";
import {
  getBusinessCustomerTags,
  getBusinessCustomers,
  getBusinessTags,
} from "@/lib/db/customer-queries";

export default async function TagsPage() {
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
        <PageHeader title="Tags" />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load business: {businessError.message}
        </p>
      </div>
    );
  }

  if (!business) {
    return (
      <div>
        <PageHeader title="Tags" subtitle="Create a business to manage tags." />
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[13px] text-slate-600">
            You need to set up a business before creating tags.
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

  let tags: Awaited<ReturnType<typeof getBusinessTags>>;
  let customers: Awaited<ReturnType<typeof getBusinessCustomers>>;
  let customerTags: Awaited<ReturnType<typeof getBusinessCustomerTags>>;
  try {
    [tags, customers, customerTags] = await Promise.all([
      getBusinessTags(business.id),
      getBusinessCustomers(business.id, true),
      getBusinessCustomerTags(business.id),
    ]);
  } catch (error) {
    return (
      <div>
        <PageHeader title="Tags" subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load customer and tag data: {error instanceof Error ? error.message : "Database request failed."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Tags"
        subtitle={`${business.name} • ${tags.length} tag${tags.length === 1 ? "" : "s"}`}
      />

      <TagsManager
        initialTags={tags}
        initialCustomers={customers}
        initialCustomerTags={customerTags}
      />
    </div>
  );
}
