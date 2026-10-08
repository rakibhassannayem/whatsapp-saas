import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminServerClient } from "@/lib/supabase/admin-server";

export async function getPlatformAdminContext() {
  const supabase = await createAdminServerClient();
  const { data, error: authError } = await supabase.auth.getUser();

  if (authError || !data.user) {
    return { status: "unauthenticated" as const };
  }

  const { data: isAdmin, error } = await supabase.rpc("is_platform_admin");

  if (error) {
    return { status: "unavailable" as const };
  }

  if (isAdmin !== true) {
    return { status: "not-admin" as const };
  }

  return { status: "authorized" as const, supabase, user: data.user };
}

export async function getPlatformAdminServiceContext() {
  const adminContext = await getPlatformAdminContext();
  if (adminContext.status !== "authorized") return adminContext;

  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey) return { status: "service-key-missing" as const };

  const serviceClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );

  return {
    status: "authorized" as const,
    serviceClient,
    user: adminContext.user,
  };
}
