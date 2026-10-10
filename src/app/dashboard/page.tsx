import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Megaphone,
  Plus,
  Tags,
  UsersRound,
  ArrowRight,
  FileText,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader, { HeaderAction } from "@/components/dashboard/page-header";
import WhatsAppTestButton from "./whatsapp-test-button";
import { getActiveDashboardBusiness, getDashboardBusinesses } from "@/lib/supabase/dashboard-business";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, tags } from "@/lib/db/schema";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  const email =
    typeof data.claims.email === "string" ? data.claims.email : "Signed-in user";

  const { data: businesses, error: businessError } = await getDashboardBusinesses(supabase);
  const business = await getActiveDashboardBusiness(businesses ?? []);

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
          <h2 className="text-[16px] font-bold text-slate-950">Set up your business</h2>
          <p className="mt-1.5 text-[13px] leading-5 text-slate-500">
            Create a business profile to start managing customers and sending messages.
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

  let customerCount = 0;
  let tagCount = 0;
  try {
    const [customerRows, tagRows] = await Promise.all([
      db.select({ count: count() }).from(customers).where(eq(customers.businessId, business.id)),
      db.select({ count: count() }).from(tags).where(eq(tags.businessId, business.id)),
    ]);
    customerCount = customerRows[0]?.count ?? 0;
    tagCount = tagRows[0]?.count ?? 0;
  } catch (countError) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load summary: {countError instanceof Error ? countError.message : "Database request failed."}
        </p>
      </div>
    );
  }

  const stats = [
    {
      label: "Customers",
      value: customerCount,
      description: "Total contacts saved",
      href: "/dashboard/customers",
      icon: UsersRound,
      color: "emerald",
    },
    {
      label: "Tags",
      value: tagCount,
      description: "Groups for targeting",
      href: "/dashboard/tags",
      icon: Tags,
      color: "violet",
    },
  ];

  const quickLinks = [
    {
      label: "Add Customer",
      description: "Save a new contact",
      href: "/dashboard/customers/new",
      icon: Plus,
      primary: true,
    },
    {
      label: "New Campaign",
      description: "Draft a broadcast message",
      href: "/dashboard/campaigns",
      icon: Megaphone,
      primary: false,
    },
    {
      label: "Message Templates",
      description: "Save reusable messages",
      href: "/dashboard/templates",
      icon: FileText,
      primary: false,
    },
    {
      label: "Send Message",
      description: "Send to your audience",
      href: "/dashboard/send-message",
      icon: Send,
      primary: false,
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back 👋`}
        subtitle={`${business.name} • ${email}`}
        actions={
          <HeaderAction href="/dashboard/send-message">
            <Send className="size-3.5" />
            Send Message
          </HeaderAction>
        }
      />

      {/* Stats */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-widest text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-4xl font-extrabold tracking-tight text-slate-950">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[13px] text-slate-500">{stat.description}</p>
                </div>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-50">
                  <Icon className="size-5 text-slate-400" />
                </span>
              </div>
              <Link
                href={stat.href}
                className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-emerald-700 hover:text-emerald-800"
              >
                View {stat.label.toLowerCase()}
                <ArrowRight className="size-3.5" />
              </Link>
            </article>
          );
        })}
      </section>

      {/* Quick actions */}
      <section className="mt-6">
        <h2 className="mb-3 text-[14px] font-bold text-slate-700">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.label}
                href={link.href}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 transition group-hover:bg-emerald-50">
                  <Icon className="size-4 text-slate-500 transition group-hover:text-emerald-600" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-slate-900">{link.label}</p>
                  <p className="truncate text-[12px] text-slate-500">{link.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-6 flex justify-center">
        <WhatsAppTestButton />
      </section>
    </div>
  );
}
