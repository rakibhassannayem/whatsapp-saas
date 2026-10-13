import { cookies } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, businessMemberships } from "@/lib/db/schema";
import { auth } from "@/auth";

export const ACTIVE_BUSINESS_COOKIE = "active-business-id";

export type DashboardBusiness = {
  id: string;
  name: string;
  created_at: string;
};

export async function getDashboardBusinesses(userIdOrParam?: unknown) {
  let userId: string | undefined;

  if (typeof userIdOrParam === "string") {
    userId = userIdOrParam;
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
  availableBusinesses: DashboardBusiness[],
): Promise<DashboardBusiness | null> {
  if (availableBusinesses.length === 0) return null;

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value;
  const matched = availableBusinesses.find((b) => b.id === activeId);

  return matched ?? availableBusinesses[0];
}
