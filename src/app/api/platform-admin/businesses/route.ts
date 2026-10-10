import { getPlatformAdminServiceContext } from "@/lib/supabase/platform-admin";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";

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
      { error: "Business details are invalid." },
      { status: 400 },
    );
  }

  const businessId = "businessId" in body ? body.businessId : null;
  const name = "name" in body ? body.name : null;
  if (
    typeof businessId !== "string" ||
    !uuidPattern.test(businessId) ||
    typeof name !== "string" ||
    name.trim().length < 1 ||
    name.trim().length > 120
  ) {
    return Response.json(
      { error: "Business ID or name is invalid. The name must be 1–120 characters." },
      { status: 400 },
    );
  }

  let data;
  try {
    [data] = await db.update(businesses)
      .set({ name: name.trim() })
      .where(eq(businesses.id, businessId))
      .returning({ id: businesses.id, name: businesses.name });
  } catch {
    return Response.json(
      { error: "Could not update the business name." },
      { status: 500 },
    );
  }
  if (!data) {
    return Response.json({ error: "Business not found." }, { status: 404 });
  }

  return Response.json({ business: data });
}
