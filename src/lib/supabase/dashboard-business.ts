import { cookies } from "next/headers";
import { asc, eq } from "drizzle-orm";
import type { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { businesses, businessMemberships } from "@/lib/db/schema";

const ACTIVE_BUSINESS_COOKIE = "active-business-id";

type DashboardSupabase = Awaited<ReturnType<typeof createClient>>;
export type DashboardBusiness = {
  id: string;
  name: string;
  created_at: string;
};

export async function getDashboardBusinesses(supabase: DashboardSupabase) {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return {
      data: null,
      error: { message: authError?.message ?? "Not signed in." },
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
      .where(eq(businessMemberships.userId, auth.user.id))
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
