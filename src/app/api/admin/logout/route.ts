import { cookies } from "next/headers";
import { ADMIN_AUTH_COOKIE_NAME } from "@/lib/admin-session";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_AUTH_COOKIE_NAME);
  return Response.json({ success: true });
}

