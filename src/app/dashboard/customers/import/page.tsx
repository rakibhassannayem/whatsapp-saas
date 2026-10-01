import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CustomerImporter from "./customer-import";

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
      <main className="p-8">Business load করতে সমস্যা: {error.message}</main>
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

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link className="text-sm underline" href="/dashboard/customers">
        ← Customers
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Import customers</h1>
      <p className="mt-1 text-gray-600">{business.name}</p>

      <Link
        className="mt-3 inline-block underline"
        href="/dashboard/customers/import"
      >
        Import customers from CSV
      </Link>

      <CustomerImporter businessId={business.id} />
    </main>
  );
}
