import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  businessMemberships,
  businessSubscriptions,
  businesses,
  subscriptionPlans,
} from "@/lib/db/schema";
import { auth } from "@/auth";
import { ACTIVE_BUSINESS_COOKIE } from "@/lib/dashboard-business";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Please sign in first." }, { status: 401 });
  }
  const user = session.user;

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
        .values({ name, createdBy: user.id! })
        .returning({ id: businesses.id, name: businesses.name });

      if (!createdBusiness) {
        throw new Error("The database did not return the created business.");
      }

      await transaction.insert(businessMemberships).values({
        businessId: createdBusiness.id,
        userId: user.id!,
      });

      const [defaultPlan] = await transaction
        .select({ id: subscriptionPlans.id })
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.billingPeriod, "monthly"))
        .limit(1);

      if (defaultPlan) {
        await transaction.insert(businessSubscriptions).values({
          businessId: createdBusiness.id,
          planId: defaultPlan.id,
          status: "active",
        });
      }

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
