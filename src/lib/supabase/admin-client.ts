import { createBrowserClient } from "@supabase/ssr";
import { ADMIN_AUTH_COOKIE_NAME } from "@/lib/supabase/admin-session";

export function createAdminClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: { name: ADMIN_AUTH_COOKIE_NAME },
      // @supabase/ssr caches one default client; admin needs a distinct client.
      isSingleton: false,
    },
  );
}
