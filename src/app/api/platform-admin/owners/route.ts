import { getPlatformAdminServiceContext } from "@/lib/supabase/platform-admin";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businessMemberships, businesses, profiles } from "@/lib/db/schema";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function blockedResponse(status: string) {
  if (status === "unauthenticated")
    return Response.json({ error: "Sign in required." }, { status: 401 });
  if (status === "not-admin")
    return Response.json({ error: "Platform admin access required." }, { status: 403 });
  return Response.json({ error: "Platform admin service is not configured." }, { status: 503 });
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

  if (!body || typeof body !== "object" || Array.isArray(body))
    return Response.json({ error: "Owner details are invalid." }, { status: 400 });

  const ownerId = "ownerId" in body ? body.ownerId : null;
  const confirmation = "confirmation" in body ? body.confirmation : null;
  if (typeof ownerId !== "string" || !uuidPattern.test(ownerId) || typeof confirmation !== "string")
    return Response.json({ error: "Owner ID or confirmation is invalid." }, { status: 400 });

  if (ownerId === context.user.id)
    return Response.json({ error: "You cannot remove your own admin account here." }, { status: 409 });

  const [{ data: isPlatformAdmin, error: roleError }, { data: userResult, error: authLookupError }] = await Promise.all([
    context.serviceClient.rpc("is_platform_admin_user", { target_user_id: ownerId }),
    context.serviceClient.auth.admin.getUserById(ownerId),
  ]);
  if (roleError || authLookupError)
    return Response.json({ error: "Could not verify this account." }, { status: 500 });
  if (isPlatformAdmin)
    return Response.json({ error: "Platform admin accounts cannot be removed from the owner list." }, { status: 409 });
  if (!userResult.user)
    return Response.json({ error: "Owner account was not found." }, { status: 404 });
  if (!userResult.user.email || confirmation.trim() !== userResult.user.email)
    return Response.json({ error: "The confirmation email does not match this account." }, { status: 400 });

  let businessCount = 0;
  try {
    businessCount = await db.transaction(async (transaction) => {
      const deletedBusinesses = await transaction.delete(businesses)
        .where(eq(businesses.createdBy, ownerId))
        .returning({ id: businesses.id });
      if (deletedBusinesses.length === 0) return 0;

      // Remove this account's memberships in other owners' businesses too.
      await transaction.delete(businessMemberships)
        .where(eq(businessMemberships.userId, ownerId));
      await transaction.delete(profiles).where(eq(profiles.id, ownerId));
      return deletedBusinesses.length;
    });
  } catch (error) {
    console.error("Local PostgreSQL owner removal failed:", error);
    return Response.json(
      { error: "Could not remove the owner's local business data. The database transaction was rolled back." },
      { status: 500 },
    );
  }
  if (businessCount < 1)
    return Response.json({ error: "No businesses were found for this owner." }, { status: 404 });

  const { error: deleteUserError } = await context.serviceClient.auth.admin.deleteUser(ownerId);
  if (deleteUserError) {
    return Response.json(
      { error: "Business data was removed, but the login account could not be deleted. Contact a developer with the server error logs." },
      { status: 500 },
    );
  }

  return Response.json({ success: true, businessCount });
}
