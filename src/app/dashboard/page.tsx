import Link from "next/link";
import { redirect } from "next/navigation";
import { Megaphone, Plus, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader, { HeaderAction } from "@/components/dashboard/page-header";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  const email =
    typeof data.claims.email === "string" ? data.claims.email : "Signed-in user";

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (businessError) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle={`Logged in as ${email}`} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load business: {businessError.message}
        </p>
      </div>
    );
  }

  if (!business) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle={`Logged in as ${email}`} />
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-[16px] font-bold text-slate-950">Create your business first</h2>
          <p className="mt-1.5 text-[13px] leading-5 text-slate-500">
            Add a business before managing customers and tags.
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

  const [
    { count: customerCount, error: customersError },
    { count: tagCount, error: tagsError },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
    supabase.from("tags").select("id", { count: "exact", head: true }).eq("business_id", business.id),
  ]);

  const countError = customersError ?? tagsError;

  if (countError) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load summary: {countError.message}
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={business.name}
        subtitle={`Business dashboard • Logged in as ${email}`}
        actions={
          <HeaderAction href="/dashboard/campaigns">
            <Megaphone className="size-3.5" />
            New Announcement
          </HeaderAction>
        }
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Total customers</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">{customerCount ?? 0}</p>
          <Link
            className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700 hover:text-emerald-800"
            href="/dashboard/customers"
          >
            <UsersRound className="size-4" />
            View customers
          </Link>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Total tags</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">{tagCount ?? 0}</p>
          <Link
            className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700 hover:text-emerald-800"
            href="/dashboard/tags"
          >
            View tags
          </Link>
        </article>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-[15px] font-bold text-slate-950">Quick actions</h2>
        <p className="mt-1 text-[13px] text-slate-500">
          Add customers or organize them with tags to prepare your next broadcast.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <HeaderAction href="/dashboard/customers/new">
            <Plus className="size-4" />
            Add Customer
          </HeaderAction>
          <HeaderAction href="/dashboard/campaigns" variant="secondary">
            <Megaphone className="size-3.5" />
            New Announcement
          </HeaderAction>
        </div>
      </section>
    </div>
  );
}

