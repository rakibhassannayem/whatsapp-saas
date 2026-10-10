import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { businesses, businessMemberships } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_BUSINESS_COOKIE } from "@/lib/supabase/dashboard-business";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError || !auth.user) {
    return Response.json({ error: "Please sign in first." }, { status: 401 });
  }
  const user = auth.user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "A valid JSON body is required." }, { status: 400 });
  }

  const name =
    body && typeof body === "object" && "name" in body && typeof body.name === "string"
      ? body.name.trim()
      : "";

  if (!name || name.length > 120) {
    return Response.json(
      { error: "Business name must be between 1 and 120 characters." },
      { status: 400 },
    );
  }

  try {
    const business = await db.transaction(async (transaction) => {
      const [createdBusiness] = await transaction
        .insert(businesses)
        .values({ name, createdBy: user.id })
        .returning({ id: businesses.id, name: businesses.name });

      if (!createdBusiness) {
        throw new Error("The database did not return the created business.");
      }

      await transaction.insert(businessMemberships).values({
        businessId: createdBusiness.id,
        userId: user.id,
      });

      return createdBusiness;
    });

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_BUSINESS_COOKIE, business.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return Response.json({ business }, { status: 201 });
  } catch (cause) {
    return Response.json(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "Could not create the business in the local database.",
      },
      { status: 500 },
    );
  }
}
