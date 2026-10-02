import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/dashboard/logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  const email =
    typeof data.claims.email === "string"
      ? data.claims.email
      : "Signed-in user";

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (businessError) {
    return (
      <main className="mx-auto max-w-6xl p-6 sm:p-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-4 text-red-700">
          Business load করতে সমস্যা: {businessError.message}
        </p>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="mx-auto max-w-6xl p-6 sm:p-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-gray-600">Logged in as: {email}</p>

        <section className="mt-8 rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold">তোমার business তৈরি হয়নি</h2>
          <p className="mt-2 text-gray-600">
            Customers ও Tags ব্যবহার করার আগে একটি business তৈরি করো।
          </p>
          <Link
            className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-white"
            href="/onboarding"
          >
            Business তৈরি করো
          </Link>
        </section>

        <div className="mt-6">
          <LogoutButton />
        </div>
      </main>
    );
  }

  const [
    { count: customerCount, error: customersError },
    { count: tagCount, error: tagsError },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
    supabase
      .from("tags")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
  ]);

  const countError = customersError ?? tagsError;

  if (countError) {
    return (
      <main className="mx-auto max-w-6xl p-6 sm:p-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-4 text-red-700">
          Summary load করতে সমস্যা: {countError.message}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-gray-600">Business dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold">{business.name}</h1>
          <p className="mt-2 text-gray-600">Logged in as: {email}</p>
        </div>

        <LogoutButton />
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-600">Total customers</p>
          <p className="mt-2 text-3xl font-semibold">{customerCount ?? 0}</p>
          <Link
            className="mt-4 inline-block text-sm font-medium underline"
            href="/dashboard/customers"
          >
            Customers দেখো
          </Link>
        </article>

        <article className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-600">Total tags</p>
          <p className="mt-2 text-3xl font-semibold">{tagCount ?? 0}</p>
          <Link
            className="mt-4 inline-block text-sm font-medium underline"
            href="/dashboard/tags"
          >
            Tags দেখো
          </Link>
        </article>
      </section>

      <section className="mt-8 rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold">Quick actions</h2>
        <p className="mt-1 text-gray-600">
          Customer list বা tag manage করতে নিচের link ব্যবহার করো।
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            className="rounded-md bg-black px-4 py-2 text-white"
            href="/dashboard/customers"
          >
            Customers manage করো
          </Link>
          <Link className="rounded-md border px-4 py-2" href="/dashboard/tags">
            Tags manage করো
          </Link>
        </div>
      </section>
    </main>
  );
}
