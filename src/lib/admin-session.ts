import { SignJWT, jwtVerify } from "jose";

/** Admin auth cookies must stay separate from the business user's session. */
export const ADMIN_AUTH_COOKIE_NAME = "whatsapp-saas-platform-admin-auth";

function getAdminJwtSecret(): Uint8Array {
  const secret =
    process.env.ADMIN_AUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "whatsapp-saas-platform-admin-session-secret-key-fallback";
  return new TextEncoder().encode(secret);
}

export type AdminTokenPayload = {
  userId: string;
  email: string;
  role: "admin";
};

export async function signAdminToken(payload: {
  userId: string;
  email: string;
}): Promise<string> {
  return await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: "admin",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getAdminJwtSecret());
}

export async function verifyAdminToken(
  token: string
): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAdminJwtSecret());
    if (payload.role !== "admin" || typeof payload.userId !== "string") {
      return null;
    }
    return {
      userId: payload.userId,
      email: typeof payload.email === "string" ? payload.email : "",
      role: "admin",
    };
  } catch {
    return null;
  }
}
