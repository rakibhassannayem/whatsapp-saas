import { createAdminServerClient } from "@/lib/supabase/admin-server";

export async function POST() {
  const supabase = await createAdminServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return Response.json({ error: "Could not log out of the admin console." }, { status: 500 });
  }

  return Response.json({ success: true });
}
