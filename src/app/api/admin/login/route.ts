import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ADMIN_AUTH_COOKIE_NAME, signAdminToken } from "@/lib/supabase/admin-session";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return Response.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const emailValue = "email" in body ? body.email : null;
    const passwordValue = "password" in body ? body.password : null;

    const email = typeof emailValue === "string" ? emailValue.toLowerCase().trim() : "";
    const password = typeof passwordValue === "string" ? passwordValue : "";

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        password: users.password,
        role: users.role,
        name: users.name,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.password) {
      return Response.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return Response.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return Response.json(
        { error: "Access denied. This account does not have platform admin privileges." },
        { status: 403 }
      );
    }

    const token = await signAdminToken({
      userId: user.id,
      email: user.email,
    });

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return Response.json(
      { error: "An unexpected error occurred during admin login." },
      { status: 500 }
    );
  }
}
