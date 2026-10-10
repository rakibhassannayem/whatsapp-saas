import { createClient } from "@/lib/supabase/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import {
  ACTIVE_BUSINESS_COOKIE,
  getDashboardBusinesses,
} from "@/lib/supabase/dashboard-business";
import { cookies } from "next/headers";

type BusinessBody = { businessId?: unknown; name?: unknown };

async function readBody(request: Request): Promise<BusinessBody | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? (body as BusinessBody)
      : null;
  } catch {
    return null;
  }
}

async function requireSignedInUser() {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) {
    return { response: Response.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  }
  return { supabase, user: auth.user } as const;
}

export async function POST(request: Request) {
  const context = await requireSignedInUser();
  if ("response" in context) return context.response;

  const body = await readBody(request);
  const businessId = body?.businessId;

  if (typeof businessId !== "string") {
    return Response.json({ error: "Business ID is required." }, { status: 400 });
  }

  const { data: availableBusinesses, error } = await getDashboardBusinesses(
    context.supabase,
  );
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  const business = availableBusinesses?.find((item) => item.id === businessId);
  if (!business) {
    return Response.json({ error: "Business access was not found." }, { status: 404 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUSINESS_COOKIE, business.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return Response.json({ success: true });
}

export async function PATCH(request: Request) {
  const context = await requireSignedInUser();
  if ("response" in context) return context.response;

  const body = await readBody(request);
  const businessId = body?.businessId;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (typeof businessId !== "string" || !name || name.length > 120) {
    return Response.json(
      { error: "Business ID and a name of 1 to 120 characters are required." },
      { status: 400 },
    );
  }

  let updatedBusiness:
    | { id: string; name: string; createdAt: Date }
    | undefined;
  try {
    [updatedBusiness] = await db
      .update(businesses)
      .set({ name })
      .where(
        and(
          eq(businesses.id, businessId),
          eq(businesses.createdBy, context.user.id),
        ),
      )
      .returning({
        id: businesses.id,
        name: businesses.name,
        createdAt: businesses.createdAt,
      });
  } catch (cause) {
    return Response.json(
      {
        error:
          cause instanceof Error ? cause.message : "Could not rename business.",
      },
      { status: 500 },
    );
  }

  const business = updatedBusiness
    ? {
        id: updatedBusiness.id,
        name: updatedBusiness.name,
        created_at: updatedBusiness.createdAt.toISOString(),
      }
    : null;
  if (!business) {
    return Response.json({ error: "Business access was not found." }, { status: 404 });
  }
  return Response.json({ business });
}

export async function DELETE(request: Request) {
  const context = await requireSignedInUser();
  if ("response" in context) return context.response;

  const body = await readBody(request);
  const businessId = body?.businessId;
  if (typeof businessId !== "string") {
    return Response.json({ error: "Business ID is required." }, { status: 400 });
  }

  const { data: accessibleBusinesses, error: listError } =
    await getDashboardBusinesses(context.supabase);
  if (listError) {
    return Response.json({ error: listError.message }, { status: 500 });
  }
  const business = accessibleBusinesses?.find((item) => item.id === businessId);
  if (!business) {
    return Response.json({ error: "Business access was not found." }, { status: 404 });
  }

  let deleted: { id: string } | undefined;
  try {
    [deleted] = await db
      .delete(businesses)
      .where(
        and(
          eq(businesses.id, businessId),
          eq(businesses.createdBy, context.user.id),
        ),
      )
      .returning({ id: businesses.id });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not delete business.";
    const isForeignKeyError = message.includes("foreign key");
    return Response.json(
      {
        error: isForeignKeyError
          ? "Related records prevented the business from being deleted."
          : message,
      },
      { status: isForeignKeyError ? 409 : 500 },
    );
  }
  if (!deleted) {
    return Response.json({ error: "Business access was not found." }, { status: 404 });
  }

  const cookieStore = await cookies();
  if (cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value === businessId) {
    const nextBusiness = accessibleBusinesses?.find((item) => item.id !== businessId);
    if (nextBusiness) {
      cookieStore.set(ACTIVE_BUSINESS_COOKIE, nextBusiness.id, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    } else {
      cookieStore.delete(ACTIVE_BUSINESS_COOKIE);
    }
  }

  return Response.json({ success: true });
}
