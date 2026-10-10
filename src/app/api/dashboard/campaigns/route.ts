import { and, eq } from "drizzle-orm";
import {
  databaseErrorResponse,
  getDashboardContext,
  readJson,
} from "@/lib/supabase/dashboard-api";
import { db } from "@/lib/db";
import { campaigns } from "@/lib/db/schema";

type CampaignBody = Record<string, unknown>;

function readCampaignFields(body: CampaignBody) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const messageBody = typeof body.message_body === "string" ? body.message_body.trim() : "";
  return name && name.length <= 100 && messageBody ? { name, messageBody } : null;
}

function readPgError(error: unknown) {
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    return {
      code: typeof error.code === "string" ? error.code : undefined,
      message: typeof error.message === "string" ? error.message : "Database request failed.",
    };
  }
  return { message: error instanceof Error ? error.message : "Database request failed." };
}

function toCampaign(row: { id: string; name: string; messageBody: string; status: string; createdAt: Date }) {
  return { id: row.id, name: row.name, message_body: row.messageBody, status: row.status, created_at: row.createdAt.toISOString() };
}

export async function POST(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;
  const parsed = await readJson<CampaignBody>(request);
  if ("response" in parsed) return parsed.response;
  const fields = readCampaignFields(parsed.data);
  if (!fields) return Response.json({ error: "Campaign name and message are required." }, { status: 400 });

  try {
    const [row] = await db.insert(campaigns).values({ businessId: context.business.id, ...fields })
      .returning({ id: campaigns.id, name: campaigns.name, messageBody: campaigns.messageBody, status: campaigns.status, createdAt: campaigns.createdAt });
    if (!row) throw new Error("The database did not return the saved campaign.");
    return Response.json(toCampaign(row), { status: 201 });
  } catch (error) {
    return databaseErrorResponse(readPgError(error), "A campaign with this name already exists.");
  }
}

export async function PATCH(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;
  const parsed = await readJson<CampaignBody>(request);
  if ("response" in parsed) return parsed.response;
  const id = parsed.data.id;
  const fields = readCampaignFields(parsed.data);
  if (typeof id !== "string" || !fields) return Response.json({ error: "Campaign details are invalid." }, { status: 400 });

  try {
    const [row] = await db.update(campaigns).set(fields).where(and(
      eq(campaigns.id, id), eq(campaigns.businessId, context.business.id),
    )).returning({ id: campaigns.id, name: campaigns.name, messageBody: campaigns.messageBody, status: campaigns.status, createdAt: campaigns.createdAt });
    if (!row) return Response.json({ error: "Campaign was not found." }, { status: 404 });
    return Response.json(toCampaign(row));
  } catch (error) {
    return databaseErrorResponse(readPgError(error), "Another campaign with this name already exists.");
  }
}

export async function DELETE(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;
  const parsed = await readJson<CampaignBody>(request);
  if ("response" in parsed) return parsed.response;
  const id = parsed.data.id;
  if (typeof id !== "string") return Response.json({ error: "Campaign ID is required." }, { status: 400 });

  try {
    const [deleted] = await db.delete(campaigns).where(and(
      eq(campaigns.id, id), eq(campaigns.businessId, context.business.id),
    )).returning({ id: campaigns.id });
    if (!deleted) return Response.json({ error: "Campaign was not found." }, { status: 404 });
    return Response.json({ success: true });
  } catch (error) {
    return databaseErrorResponse(readPgError(error));
  }
}
