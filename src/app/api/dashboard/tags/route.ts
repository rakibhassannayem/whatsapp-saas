import { and, eq } from "drizzle-orm";
import {
  databaseErrorResponse,
  getDashboardContext,
  readJson,
} from "@/lib/supabase/dashboard-api";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";

type TagBody = Record<string, unknown>;

function readPgError(error: unknown) {
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    return {
      code: typeof error.code === "string" ? error.code : undefined,
      message: typeof error.message === "string" ? error.message : "Database request failed.",
    };
  }
  return { message: error instanceof Error ? error.message : "Database request failed." };
}

function toTag(row: { id: string; name: string; createdAt: Date }) {
  return { id: row.id, name: row.name, created_at: row.createdAt.toISOString() };
}

export async function POST(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;
  const parsed = await readJson<TagBody>(request);
  if ("response" in parsed) return parsed.response;
  const name = typeof parsed.data.name === "string" ? parsed.data.name.trim() : "";
  if (!name || name.length > 50) return Response.json({ error: "Tag name must be 1 to 50 characters." }, { status: 400 });

  try {
    const [row] = await db.insert(tags).values({ businessId: context.business.id, name })
      .returning({ id: tags.id, name: tags.name, createdAt: tags.createdAt });
    if (!row) throw new Error("The database did not return the saved tag.");
    return Response.json(toTag(row), { status: 201 });
  } catch (error) {
    return databaseErrorResponse(readPgError(error), "A tag with this name already exists.");
  }
}

export async function DELETE(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;
  const parsed = await readJson<TagBody>(request);
  if ("response" in parsed) return parsed.response;
  const id = parsed.data.id;
  if (typeof id !== "string") return Response.json({ error: "Tag ID is required." }, { status: 400 });

  try {
    const [deleted] = await db.delete(tags).where(and(
      eq(tags.id, id), eq(tags.businessId, context.business.id),
    )).returning({ id: tags.id });
    if (!deleted) return Response.json({ error: "Tag was not found." }, { status: 404 });
    return Response.json({ success: true });
  } catch (error) {
    return databaseErrorResponse(readPgError(error));
  }
}
