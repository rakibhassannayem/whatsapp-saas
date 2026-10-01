import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TagsManager from "./tags-manager";

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
    return <main className="p-8">Business load করতে সমস্যা: {businessError.message}</main>;
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

  const { data: tags, error: tagsError } = await supabase
    .from("tags")
    .select("id, name, created_at")
    .eq("business_id", business.id)
    .order("name", { ascending: true });

  if (tagsError) {
    return <main className="p-8">Tags load করতে সমস্যা: {tagsError.message}</main>;
  }

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8">
      <Link className="text-sm underline" href="/dashboard">
        ← Dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Tags</h1>
      <p className="mt-1 text-gray-600">{business.name}</p>

      <TagsManager businessId={business.id} initialTags={tags ?? []} />
    </main>
  );
}