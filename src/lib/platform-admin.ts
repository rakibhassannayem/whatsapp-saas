import "server-only";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ADMIN_AUTH_COOKIE_NAME, verifyAdminToken } from "@/lib/admin-session";

export type PlatformAdminContext =
  | { status: "unauthenticated" }
  | { status: "not-admin" }
  | { status: "unavailable" }
  | {
      status: "authorized";
      user: {
        id: string;
        email?: string;
        name?: string;
      };
    };

export async function getPlatformAdminContext(): Promise<PlatformAdminContext> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return { status: "unauthenticated" };
    }

    const payload = await verifyAdminToken(token);
    if (!payload?.userId) {
      return { status: "unauthenticated" };
    }

    const [adminUser] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!adminUser) {
      return { status: "unauthenticated" };
    }

    if (adminUser.role !== "admin") {
      return { status: "not-admin" };
    }

    const user = {
      id: adminUser.id,
      email: adminUser.email || undefined,
      name: adminUser.name || undefined,
    };

    return { status: "authorized", user };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("Platform admin context error:", error);
    return { status: "unavailable" };
  }
}

export async function getPlatformAdminServiceContext(): Promise<PlatformAdminContext> {
  return getPlatformAdminContext();
}
