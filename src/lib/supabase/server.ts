import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { auth } from "@/auth";

export async function createClient() {
  const cookieStore = await cookies();
  const session = await auth();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component ignore
          }
        },
      },
    },
  );

  if (session?.user) {
    const authUser = {
      id: session.user.id || "",
      email: session.user.email || undefined,
      user_metadata: { full_name: session.user.name },
      app_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    };

    supabase.auth.getUser = async () => {
      return { data: { user: authUser as any }, error: null };
    };

    (supabase.auth as any).getClaims = async () => {
      return {
        data: { claims: { sub: authUser.id, email: authUser.email } },
        error: null,
      };
    };
  }

  return supabase;
}