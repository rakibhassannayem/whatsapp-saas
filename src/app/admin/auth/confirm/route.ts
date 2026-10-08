import { NextResponse, type NextRequest } from "next/server";
import { createAdminServerClient } from "@/lib/supabase/admin-server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const next = request.nextUrl.searchParams.get("next");

  if (!tokenHash || type !== "invite") {
    // Supabase's default email template verifies the invitation first, then
    // returns the session in the URL fragment. Fragments never reach Route
    // Handlers, so hand the browser URL to a client-side completion page.
    const destination = new URL("/admin-invite/complete", request.url);
    if (next === "/admin/setup") destination.searchParams.set("next", next);
    return NextResponse.redirect(destination);
  }

  // Verify the invite into the separate admin cookie, never the business session.
  const supabase = await createAdminServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "invite",
  });

  if (error) {
    return Response.json(
      { error: "This invitation link has expired or has already been used." },
      { status: 400 },
    );
  }

  const destination = next === "/admin/setup" ? next : "/admin";
  return NextResponse.redirect(new URL(destination, request.url));
}
