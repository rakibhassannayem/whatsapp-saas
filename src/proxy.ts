import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_AUTH_COOKIE_NAME } from "@/lib/supabase/admin-session";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const isAdminRequest =
    request.nextUrl.pathname === "/admin" ||
    request.nextUrl.pathname.startsWith("/admin/") ||
    request.nextUrl.pathname.startsWith("/api/platform-admin/") ||
    request.nextUrl.pathname.startsWith("/api/admin/");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      ...(isAdminRequest
        ? { cookieOptions: { name: ADMIN_AUTH_COOKIE_NAME } }
        : {}),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });

          if (headers) {
            Object.entries(headers).forEach(([name, value]) => {
              supabaseResponse.headers.set(name, value);
            });
          }
        },
      },
    },
  );

  await supabase.auth.getClaims();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
