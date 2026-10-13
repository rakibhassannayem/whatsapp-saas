import { getPlatformAdminServiceContext } from "@/lib/supabase/platform-admin";

export async function POST() {
  const context = await getPlatformAdminServiceContext();
  if (context.status === "unauthenticated") {
    return Response.json({ error: "Sign in required." }, { status: 401 });
  }
  if (context.status === "not-admin") {
    return Response.json({ error: "Platform admin access required." }, { status: 403 });
  }
  return Response.json({ success: true });
}
