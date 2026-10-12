import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const cookiesToDelete = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "authjs.csrf-token",
    "authjs.callback-url",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "next-auth.callback-url",
    "active-business-id",
  ];

  for (const name of cookiesToDelete) {
    cookieStore.delete(name);
  }

  return Response.json({ success: true });
}
