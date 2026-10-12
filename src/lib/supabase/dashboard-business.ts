import { cookies } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, businessMemberships } from "@/lib/db/schema";
import { auth } from "@/auth";

const ACTIVE_BUSINESS_COOKIE = "active-business-id";

export type DashboardBusiness = {
  id: string;
  name: string;
  created_at: string;
};

export async function getDashboardBusinesses(param?: unknown) {
  let userId: string | undefined;

  if (typeof param === "string") {
    userId = param;
  } else if (param && typeof (param as { auth?: { getUser?: () => Promise<{ data?: { user?: { id?: string } } }> } }).auth?.getUser === "function") {
    const { data } = await (param as { auth: { getUser: () => Promise<{ data?: { user?: { id?: string } } }> } }).auth.getUser();
    userId = data?.user?.id;
  }

  if (!userId) {
    const session = await auth();
    userId = session?.user?.id;
  }

  if (!userId) {
    return {
      data: null,
      error: { message: "Not signed in." },
    };
  }

  try {
    const rows = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        createdAt: businesses.createdAt,
      })
      .from(businesses)
      .innerJoin(
        businessMemberships,
        eq(businessMemberships.businessId, businesses.id),
      )
      .where(eq(businessMemberships.userId, userId))
      .orderBy(asc(businesses.createdAt));

    return {
      data: rows.map((business) => ({
        id: business.id,
        name: business.name,
        created_at: business.createdAt.toISOString(),
      })),
      error: null,
    };
  } catch (cause) {
    return {
      data: null,
      error: {
        message:
          cause instanceof Error ? cause.message : "Could not load businesses.",
      },
    };
  }
}

export async function getActiveDashboardBusiness(
  businesses: DashboardBusiness[],
) {
  const cookieStore = await cookies();
  const selectedId = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value;
  return (
    businesses.find((business) => business.id === selectedId) ??
    businesses[0] ??
    null
  );
}

export { ACTIVE_BUSINESS_COOKIE };
