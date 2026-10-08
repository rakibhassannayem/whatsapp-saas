import { getPlatformAdminServiceContext } from "@/lib/supabase/platform-admin";

export async function POST() {
  const context = await getPlatformAdminServiceContext();
  if (context.status === "unauthenticated") {
    return Response.json({ error: "Sign in required." }, { status: 401 });
  }
  if (context.status === "not-admin") {
    return Response.json({ error: "Platform admin access required." }, { status: 403 });
  }
  if (context.status !== "authorized") {
    return Response.json({ error: "Platform admin service is not configured." }, { status: 503 });
  }

  const { data, error } = await context.serviceClient.rpc(
    "mark_platform_admin_activated",
    { target_user_id: context.user.id },
  );
  if (error || data !== true) {
    console.error("Could not mark platform admin as activated:", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      userId: context.user.id,
    });
    return Response.json({ error: "Your password was saved, but admin setup could not be marked complete. Please retry or contact an admin." }, { status: 503 });
  }

  return Response.json({ success: true });
}
