import { getPlatformAdminServiceContext } from "@/lib/supabase/platform-admin";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

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

  const [targetUser] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!targetUser) {
    return Response.json(
      { error: "Business user not found." },
      { status: 404 },
    );
  }

  if (targetUser.role === "admin") {
    return Response.json(
      {
        error: "Platform admin accounts cannot be suspended from this dashboard.",
      },
      { status: 409 },
    );
  }

  return Response.json({ success: true, action });
}
