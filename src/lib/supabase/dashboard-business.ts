import { cookies } from "next/headers";
import type { createClient } from "@/lib/supabase/server";

const ACTIVE_BUSINESS_COOKIE = "active-business-id";

type DashboardSupabase = Awaited<ReturnType<typeof createClient>>;
export type DashboardBusiness = {
  id: string;
  name: string;
  created_at: string;
};

export async function getDashboardBusinesses(supabase: DashboardSupabase) {
  return supabase
    .from("businesses")
    .select("id, name, created_at")
    .order("created_at", { ascending: true });
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
