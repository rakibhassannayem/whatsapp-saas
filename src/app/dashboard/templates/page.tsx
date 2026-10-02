import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TemplatesManager from "./templates-manager";

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

  const { data: templates, error: templatesError } = await supabase
    .from("message_templates")
    .select("id, name, body, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (templatesError) {
    return (
      <main className="p-8">
        Templates load করতে সমস্যা: {templatesError.message}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8">
      <h1 className="text-2xl font-semibold">Message templates</h1>
      <p className="mt-1 text-gray-600">{business.name}</p>

      <TemplatesManager initialTemplates={templates ?? []} />
    </main>
  );
}
