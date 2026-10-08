import { getPlatformAdminServiceContext } from "@/lib/supabase/platform-admin";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export async function POST(request: Request) {
  const context = await getPlatformAdminServiceContext();
  if (context.status !== "authorized") return blockedResponse(context.status);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const emailValue =
    body && typeof body === "object" && !Array.isArray(body) && "email" in body
      ? body.email
      : null;
  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !emailPattern.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  // Promote an existing Auth user without requiring a new public signup.
  const { data: existingRows, error: lookupError } =
    await context.serviceClient.rpc("ensure_platform_admin_by_email", {
      target_email: email,
    });
  if (lookupError) {
    console.error("Could not read or update platform-admin allowlist:", {
      code: lookupError.code,
      message: lookupError.message,
      details: lookupError.details,
      hint: lookupError.hint,
    });
    const guidance =
      lookupError.code === "PGRST202"
        ? "Supabase API cannot find the allowlist function. Reapply the updated platform-admin invitation migration, then refresh the API schema cache."
        : lookupError.code === "42501"
          ? "The server role cannot run the allowlist function. Reapply the migration so it grants function access to service_role."
          : `Could not access the platform-admin allowlist (${lookupError.code ?? "unknown error"}). Check the Supabase API error details.`;
    return Response.json(
      { error: guidance },
      { status: 503 },
    );
  }

  const existing = Array.isArray(existingRows) ? existingRows[0] : null;
  if (existing) {
    const { data: currentAdmins, error: adminsError } =
      await context.serviceClient.rpc("list_platform_admins");
    if (adminsError) {
      return Response.json(
        { error: "Admin access was recorded, but its setup status could not be checked." },
        { status: 503 },
      );
    }
    const currentAdmin = (currentAdmins ?? []).find(
      (admin: { user_id: string }) => admin.user_id === existing.user_id,
    ) as { activated_at: string | null } | undefined;

    if (currentAdmin?.activated_at) {
      if (!existing.was_already_admin) {
        return Response.json({ success: true, action: "promoted", email });
      }
      return Response.json(
        { error: "This email already has platform-admin access." },
        { status: 409 },
      );
    }

    const setupRedirect = new URL(
      "/admin-invite/complete?next=%2Fadmin%2Fsetup",
      request.url,
    ).toString();
    const { error: setupEmailError } =
      await context.serviceClient.auth.resetPasswordForEmail(email, {
        redirectTo: setupRedirect,
      });
    if (setupEmailError) {
      console.error("Could not send platform-admin password setup email:", {
        code: setupEmailError.status,
        message: setupEmailError.message,
        email,
      });
      return Response.json(
        { error: `Admin access is recorded, but the password setup email could not be sent: ${setupEmailError.message}` },
        { status: 503 },
      );
    }

    return Response.json({ success: true, action: "setup-email-sent", email });
  }

  const redirectTo = new URL(
    "/admin-invite/complete?next=%2Fadmin%2Fsetup",
    request.url,
  ).toString();
  const { data: invite, error: inviteError } =
    await context.serviceClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { platform_role: "platform_admin" },
    });

  if (inviteError || !invite.user) {
    // If an Auth account was created concurrently, promote that account instead.
    const { data: racedRows } = await context.serviceClient.rpc(
      "ensure_platform_admin_by_email",
      { target_email: email },
    );
    const raced = Array.isArray(racedRows) ? racedRows[0] : null;
    if (raced) {
      return Response.json({ success: true, action: "promoted", email });
    }
    return Response.json(
      { error: inviteError?.message ?? "Could not send the admin invitation." },
      { status: 400 },
    );
  }

  const { data: granted, error: grantError } =
    await context.serviceClient.rpc("ensure_platform_admin_user", {
      target_user_id: invite.user.id,
    });
  if (grantError || granted !== true) {
    console.error("Could not record invited platform admin:", {
      code: grantError?.code,
      message: grantError?.message,
      details: grantError?.details,
      hint: grantError?.hint,
      invitedUserId: invite.user.id,
    });
    return Response.json(
      {
        error: `The invitation email was sent, but the allowlist update failed (${grantError?.code ?? "admin not confirmed"}). Reapply the updated platform-admin invitation migration, then try this email again.`,
      },
      { status: 503 },
    );
  }

  return Response.json({ success: true, action: "invited", email });
}

export async function DELETE(request: Request) {
  const context = await getPlatformAdminServiceContext();
  if (context.status !== "authorized") return blockedResponse(context.status);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const userId =
    body && typeof body === "object" && !Array.isArray(body) && "userId" in body
      ? body.userId
      : null;
  if (
    typeof userId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)
  ) {
    return Response.json({ error: "Admin account ID is invalid." }, { status: 400 });
  }
  if (userId === context.user.id) {
    return Response.json({ error: "You cannot remove your own admin access." }, { status: 409 });
  }

  const { data: result, error } = await context.serviceClient.rpc(
    "remove_platform_admin",
    { target_user_id: userId },
  );
  if (error) {
    console.error("Could not remove platform-admin access:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return Response.json(
      { error: "Could not update the platform-admin allowlist. Apply the admin activation migration first." },
      { status: 503 },
    );
  }
  if (result === "last_admin") {
    return Response.json({ error: "The last platform admin cannot be removed." }, { status: 409 });
  }
  if (result === "not_found") {
    return Response.json({ error: "Platform admin was not found." }, { status: 404 });
  }

  return Response.json({ success: true });
}
