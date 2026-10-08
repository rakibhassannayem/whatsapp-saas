import { getPlatformAdminServiceContext } from "@/lib/supabase/platform-admin";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function blockedResponse(status: string) {
  if (status === "unauthenticated") {
    return Response.json({ error: "Sign in required." }, { status: 401 });
  }
  if (status === "not-admin") {
    return Response.json(
      { error: "Platform admin access required." },
      { status: 403 },
    );
  }
  return Response.json(
    { error: "Platform admin service is not configured." },
    { status: 503 },
  );
}

export async function PATCH(request: Request) {
  const context = await getPlatformAdminServiceContext();
  if (context.status !== "authorized") return blockedResponse(context.status);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json(
      { error: "User details are invalid." },
      { status: 400 },
    );
  }

  const userId = "userId" in body ? body.userId : null;
  const action = "action" in body ? body.action : null;
  if (
    typeof userId !== "string" ||
    !uuidPattern.test(userId) ||
    (action !== "suspend" && action !== "reactivate")
  ) {
    return Response.json(
      { error: "User ID or action is invalid." },
      { status: 400 },
    );
  }

  if (userId === context.user.id) {
    return Response.json(
      { error: "You cannot suspend your own platform admin account." },
      { status: 409 },
    );
  }

  const [
    { data: isPlatformAdmin, error: roleError },
    { count, error: membershipError },
  ] = await Promise.all([
    context.serviceClient.rpc("is_platform_admin_user", {
      target_user_id: userId,
    }),
    context.serviceClient
      .from("business_memberships")
      .select("business_id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  if (roleError || membershipError) {
    return Response.json(
      { error: "Could not verify the user account." },
      { status: 500 },
    );
  }
  if (isPlatformAdmin) {
    return Response.json(
      {
        error: "Platform admin accounts cannot be suspended from this dashboard.",
      },
      { status: 409 },
    );
  }
  if (!count) {
    return Response.json(
      { error: "Business user not found." },
      { status: 404 },
    );
  }

  const { error } = await context.serviceClient.auth.admin.updateUserById(
    userId,
    {
      ban_duration: action === "suspend" ? "876000h" : "none",
    },
  );

  if (error) {
    return Response.json(
      { error: "Could not update the user account status." },
      { status: 500 },
    );
  }

  return Response.json({ success: true, action });
}
