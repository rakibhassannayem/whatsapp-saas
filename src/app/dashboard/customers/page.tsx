import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CustomerForm from "./customer-form";

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

  const { data: customers, error: customersError } = await supabase
    .from("customers")
    .select("id, full_name, phone_e164, email, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (customersError) {
    return (
      <main className="p-8">
        Customer load করতে সমস্যা: {customersError.message}
      </main>
    );
  }

  const { data: tags, error: tagsError } = await supabase
    .from("tags")
    .select("id, name")
    .eq("business_id", business.id)
    .order("name", { ascending: true });

  if (tagsError) {
    return (
      <main className="p-8">Tag load করতে সমস্যা: {tagsError.message}</main>
    );
  }

  const { data: customerTags, error: customerTagsError } = await supabase
    .from("customer_tags")
    .select("customer_id, tag_id")
    .eq("business_id", business.id);

  if (customerTagsError) {
    return (
      <main className="p-8">
        Customer tag load করতে সমস্যা: {customerTagsError.message}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link className="text-sm underline" href="/dashboard">
        ← Dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Customers</h1>
      <p className="mt-1 text-gray-600">{business.name}</p>

      <Link
        className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-white"
        href="/dashboard/customers/import"
      >
        Import CSV / Excel
      </Link>

      <CustomerForm
        businessId={business.id}
        initialCustomers={customers ?? []}
        initialTags={tags ?? []}
        initialCustomerTags={customerTags ?? []}
      />
    </main>
  );
}
