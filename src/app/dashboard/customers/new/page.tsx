import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/dashboard/page-header";
import AddCustomerTabs from "@/components/dashboard/customers/new/add-customer-tabs";
import { getActiveDashboardBusiness, getDashboardBusinesses } from "@/lib/supabase/dashboard-business";
import { getBusinessTags } from "@/lib/db/customer-queries";

export default async function NewCustomerPage() {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();

  if (authError || !auth?.claims) {
    redirect("/login");
  }

  const { data: businesses } = await getDashboardBusinesses(supabase);
  const business = await getActiveDashboardBusiness(businesses ?? []);

  if (!business) {
    return (
      <div>
        <PageHeader title="Add customer" subtitle="Create a business first." />
        <Link
          className="mt-4 inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 text-[12px] font-bold text-white transition hover:bg-emerald-600"
          href="/onboarding"
        >
          Create business
        </Link>
      </div>
    );
  }

  const tags = await getBusinessTags(business.id);

  return (
    <div>
      <Link
        href="/dashboard/customers"
        className="text-[13px] font-medium text-slate-500 transition hover:text-emerald-700"
      >
        ← Customers
      </Link>
      <div className="mt-3">
        <PageHeader
          title="Add customers"
          subtitle={`${business.name} • Add one manually or import your Excel / CSV file`}
        />
      </div>
      <AddCustomerTabs tags={tags} />
    </div>
  );
}
