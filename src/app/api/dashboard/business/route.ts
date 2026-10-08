import { createClient } from "@/lib/supabase/server";
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

  // RLS applies here, so users can only select a business they belong to.
  const { data: business, error } = await context.supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .maybeSingle();

  if (error) {
    const denied = error.code === "42501";
    return Response.json(
      {
        error: denied
          ? "You do not have permission to read this business. Check its SELECT grants and policies."
          : error.message,
      },
      { status: denied ? 403 : 500 },
    );
  }
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

  // The signed-in user's RLS policies decide whether they can rename this row.
  const { data: business, error } = await context.supabase
    .from("businesses")
    .update({ name })
    .eq("id", businessId)
    .select("id, name, created_at")
    .maybeSingle();

  if (error) {
    const denied = error.code === "42501";
    return Response.json(
      {
        error: denied
          ? "Only the business creator can rename it. Confirm the owner permissions migration has been applied."
          : error.message,
      },
      { status: denied ? 403 : 500 },
    );
  }
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

  // No service-role client is used; RLS controls the delete and its dependencies.
  const { data: deleted, error } = await context.supabase
    .from("businesses")
    .delete()
    .eq("id", businessId)
    .select("id")
    .maybeSingle();

  if (error) {
    const isForeignKeyError = error.code === "23503";
    const isPermissionError = error.code === "42501";
    return Response.json(
      {
        error: isForeignKeyError
          ? "This business still has records that prevent deletion. Resolve those records first, then try again."
          : isPermissionError
            ? "Only the business creator can delete it. Confirm the owner permissions migration has been applied."
            : error.message,
      },
      { status: isForeignKeyError ? 409 : isPermissionError ? 403 : 500 },
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
