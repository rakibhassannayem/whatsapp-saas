import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/dashboard/page-header";
import TagsManager from "@/components/dashboard/tags/tags-manager";

export default async function TagsPage() {
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

  const { data: tags, error: tagsError } = await supabase
    .from("tags")
    .select("id, name, created_at")
    .eq("business_id", business.id)
    .order("name", { ascending: true });

  if (tagsError) {
    return (
      <div>
        <PageHeader title="Tags" subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load tags: {tagsError.message}
        </p>
      </div>
    );
  }

  const { data: customers, error: customersError } = await supabase
    .from("customers")
    .select("id, full_name, phone_e164, email")
    .eq("business_id", business.id)
    .order("full_name", { ascending: true });

  if (customersError) {
    return (
      <div>
        <PageHeader title="Tags" subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load customers: {customersError.message}
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
        <PageHeader title="Tags" subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load customer tags: {customerTagsError.message}
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Tags"
        subtitle={`${business.name} • ${tags?.length ?? 0} tag${tags?.length === 1 ? "" : "s"}`}
      />

      <TagsManager
        initialTags={tags ?? []}
        initialCustomers={customers ?? []}
        initialCustomerTags={customerTags ?? []}
      />
    </div>
  );
}
