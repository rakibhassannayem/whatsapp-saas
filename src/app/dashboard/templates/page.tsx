import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/dashboard/page-header";
import TemplatesManager from "@/components/dashboard/templates/templates-manager";

export default async function TemplatesPage() {
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
        <PageHeader title="Message Templates" />
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
          title="Message Templates"
          subtitle="Create a business to manage templates."
        />
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[13px] text-slate-600">
            You need to set up a business before creating message templates.
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

  const { data: templates, error: templatesError } = await supabase
    .from("message_templates")
    .select("id, name, body, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (templatesError) {
    return (
      <div>
        <PageHeader title="Message Templates" subtitle={business.name} />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
          Could not load templates: {templatesError.message}
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Message Templates"
        subtitle={`${business.name} • ${templates?.length ?? 0} template${templates?.length === 1 ? "" : "s"}`}
      />
      <TemplatesManager initialTemplates={templates ?? []} />
    </div>
  );
}
