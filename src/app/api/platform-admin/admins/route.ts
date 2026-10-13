import { getPlatformAdminServiceContext } from "@/lib/supabase/platform-admin";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

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

  const [existingUser] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!existingUser) {
    return Response.json(
      { error: "No user found with this email. The user must register first." },
      { status: 404 },
    );
  }

  if (existingUser.role === "admin") {
    return Response.json(
      { error: "This email already has platform-admin access." },
      { status: 409 },
    );
  }

  await db
    .update(users)
    .set({ role: "admin" })
    .where(eq(users.id, existingUser.id));

  return Response.json({ success: true, action: "promoted", email });
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

  const [adminCountResult] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.role, "admin"));

  if ((adminCountResult?.count ?? 0) <= 1) {
    return Response.json({ error: "The last platform admin cannot be removed." }, { status: 409 });
  }

  const [updatedUser] = await db
    .update(users)
    .set({ role: "user" })
    .where(eq(users.id, userId))
    .returning({ id: users.id });

  if (!updatedUser) {
    return Response.json({ error: "Platform admin was not found." }, { status: 404 });
  }

  return Response.json({ success: true });
}
