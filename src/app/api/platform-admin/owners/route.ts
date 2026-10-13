import { getPlatformAdminServiceContext } from "@/lib/platform-admin";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businessMemberships, businesses, profiles, users } from "@/lib/db/schema";

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

  const [ownerUser] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, ownerId))
    .limit(1);

  if (!ownerUser)
    return Response.json({ error: "Owner account was not found." }, { status: 404 });

  if (ownerUser.role === "admin")
    return Response.json({ error: "Platform admin accounts cannot be removed from the owner list." }, { status: 409 });

  if (!ownerUser.email || confirmation.trim() !== ownerUser.email)
    return Response.json({ error: "The confirmation email does not match this account." }, { status: 400 });

  let businessCount = 0;
  try {
    businessCount = await db.transaction(async (transaction) => {
      const deletedBusinesses = await transaction.delete(businesses)
        .where(eq(businesses.createdBy, ownerId))
        .returning({ id: businesses.id });

      // Remove this account's memberships in other owners' businesses too.
      await transaction.delete(businessMemberships)
        .where(eq(businessMemberships.userId, ownerId));
      await transaction.delete(profiles).where(eq(profiles.id, ownerId));
      await transaction.delete(users).where(eq(users.id, ownerId));
      return deletedBusinesses.length;
    });
  } catch (error) {
    console.error("Local PostgreSQL owner removal failed:", error);
    return Response.json(
      { error: "Could not remove the owner's data. The database transaction was rolled back." },
      { status: 500 },
    );
  }

  return Response.json({ success: true, businessCount });
}
