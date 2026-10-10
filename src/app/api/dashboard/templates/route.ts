import { and, eq } from "drizzle-orm";
import {
  databaseErrorResponse,
  getDashboardContext,
  readJson,
} from "@/lib/supabase/dashboard-api";
import { db } from "@/lib/db";
import { messageTemplates } from "@/lib/db/schema";

type TemplateBody = Record<string, unknown>;

function readPgError(error: unknown) {
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    return {
      code: typeof error.code === "string" ? error.code : undefined,
      message: typeof error.message === "string" ? error.message : "Database request failed.",
    };
  }
  return { message: error instanceof Error ? error.message : "Database request failed." };
}

export async function POST(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;
  const parsed = await readJson<TemplateBody>(request);
  if ("response" in parsed) return parsed.response;
  const name = typeof parsed.data.name === "string" ? parsed.data.name.trim() : "";
  const body = typeof parsed.data.body === "string" ? parsed.data.body.trim() : "";
  if (!name || name.length > 100 || !body) return Response.json({ error: "Template name and message are required." }, { status: 400 });

  try {
    const [row] = await db.insert(messageTemplates).values({ businessId: context.business.id, name, body })
      .returning({ id: messageTemplates.id, name: messageTemplates.name, body: messageTemplates.body, createdAt: messageTemplates.createdAt });
    if (!row) throw new Error("The database did not return the saved template.");
    return Response.json({ id: row.id, name: row.name, body: row.body, created_at: row.createdAt.toISOString() }, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(readPgError(error), "A template with this name already exists.");
  }
}

export async function DELETE(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;
  const parsed = await readJson<TemplateBody>(request);
  if ("response" in parsed) return parsed.response;
  const id = parsed.data.id;
  if (typeof id !== "string") return Response.json({ error: "Template ID is required." }, { status: 400 });

  try {
    const [deleted] = await db.delete(messageTemplates).where(and(
      eq(messageTemplates.id, id), eq(messageTemplates.businessId, context.business.id),
    )).returning({ id: messageTemplates.id });
    if (!deleted) return Response.json({ error: "Template was not found." }, { status: 404 });
    return Response.json({ success: true });
  } catch (error) {
    return databaseErrorResponse(readPgError(error));
  }
}
