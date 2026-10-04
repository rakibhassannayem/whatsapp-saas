import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader, { HeaderAction } from "@/components/dashboard/page-header";
import CustomerList from "@/components/dashboard/customers/customer-list";

export default async function CustomersPage() {
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
        <PageHeader title="Customers" />
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
          title="Customers"
          subtitle="Create a business to manage customers."
        />
        <Link
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-[12px] font-bold text-white transition hover:bg-emerald-600"
          href="/onboarding"
        >
          Create business
        </Link>
      </div>
    );
  }

  const { data: customers, error: customersError } = await supabase
    .from("customers")
    .select("id, full_name, phone_e164, email, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (customersError) {
    return (
      <div>
        <PageHeader title="Customers" subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load customers: {customersError.message}
        </p>
      </div>
    );
  }

  const { data: tags, error: tagsError } = await supabase
    .from("tags")
    .select("id, name")
    .eq("business_id", business.id)
    .order("name", { ascending: true });

  if (tagsError) {
    return (
      <div>
        <PageHeader title="Customers" subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load tags: {tagsError.message}
        </p>
      </div>
    );
  }

  const { data: customerTags, error: customerTagsError } = await supabase
    .from("customer_tags")
    .select("customer_id, tag_id")
    .eq("business_id", business.id);

  if (customerTagsError) {
    return (
      <div>
        <PageHeader title="Customers" subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load customer tags: {customerTagsError.message}
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${business.name} • ${customers?.length ?? 0} total`}
        actions={
          <>
            <HeaderAction
              href="/dashboard/customers/import"
              variant="secondary"
            >
              <Upload className="size-3.5" />
              Import
            </HeaderAction>
            <HeaderAction href="/dashboard/customers/new">
              <Plus className="size-4" />
              Add Customer
            </HeaderAction>
          </>
        }
      />

      <CustomerList
        initialCustomers={customers ?? []}
        initialTags={tags ?? []}
        initialCustomerTags={customerTags ?? []}
      />
    </div>
  );
}
