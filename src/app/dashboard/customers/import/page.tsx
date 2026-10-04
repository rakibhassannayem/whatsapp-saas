import Link from "next/link";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/dashboard/page-header";
import CustomerImporter from "@/components/dashboard/customers/import/customer-import";

export default async function ImportCustomersPage() {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();

  if (authError || !auth?.claims) {
    redirect("/login");
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .select("id, name")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return (
      <div>
        <PageHeader
          title="Import customers"
          subtitle="Could not load business."
        />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          {error.message}
        </p>
      </div>
    );
  }

  if (!business) {
    return (
      <div>
        <PageHeader
          title="Import customers"
          subtitle="Create a business first."
        />
        <Link
          className="mt-4 inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 text-[12px] font-bold text-white transition hover:bg-emerald-600"
          href="/onboarding"
        >
          Create business
        </Link>
      </div>
    );
  }

  const { data: tags, error: tagsError } = await supabase
    .from("tags")
    .select("id, name")
    .eq("business_id", business.id)
    .order("name", { ascending: true });

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
          title="Import customers"
          subtitle={`${business.name} • Upload your Excel or CSV customer list`}
          actions={
            <Link
              href="/dashboard/customers/new"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <UserPlus className="size-3.5" />
              Add single customer
            </Link>
          }
        />
      </div>
      {tagsError && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load tags: {tagsError.message}
        </p>
      )}
      <CustomerImporter initialTags={tags ?? []} />
    </div>
  );
}
