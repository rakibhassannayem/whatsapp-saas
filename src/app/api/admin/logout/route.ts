import { createAdminServerClient } from "@/lib/supabase/admin-server";

export async function POST() {
  const supabase = await createAdminServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return Response.json({ error: "Admin logout করা যায়নি।" }, { status: 500 });
  }

  return Response.json({ success: true });
}
