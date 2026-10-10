import { and, eq, inArray, notInArray } from "drizzle-orm";
import {
  databaseErrorResponse,
  getDashboardContext,
  readJson,
} from "@/lib/supabase/dashboard-api";
import { db } from "@/lib/db";
import { campaignRecipients, campaigns, customers } from "@/lib/db/schema";

type RecipientBody = Record<string, unknown>;
const maxRecipientsPerRequest = 1000;

function readPgError(error: unknown) {
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    return {
      code: typeof error.code === "string" ? error.code : undefined,
      message: typeof error.message === "string" ? error.message : "Database request failed.",
    };
  }
  return { message: error instanceof Error ? error.message : "Database request failed." };
}

async function findOwnedCampaign(businessId: string, campaignId: string) {
  const [campaign] = await db.select({ id: campaigns.id }).from(campaigns).where(and(
    eq(campaigns.id, campaignId), eq(campaigns.businessId, businessId),
  )).limit(1);
  return campaign;
}

function readIds(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > maxRecipientsPerRequest || value.some((id) => typeof id !== "string")) return null;
  return [...new Set(value as string[])];
}

export async function POST(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;
  const parsed = await readJson<RecipientBody>(request);
  if ("response" in parsed) return parsed.response;
  const { campaignId } = parsed.data;
  const customerIds = readIds(parsed.data.customerIds);
  if (typeof campaignId !== "string" || !customerIds) {
    return Response.json({ error: "Campaign and customer IDs are required." }, { status: 400 });
  }

  try {
    const campaign = await findOwnedCampaign(context.business.id, campaignId);
    if (!campaign) return Response.json({ error: "Campaign was not found." }, { status: 404 });

    const foundCustomers = await db.select({ id: customers.id }).from(customers).where(and(
      eq(customers.businessId, context.business.id), inArray(customers.id, customerIds),
    ));
    if (foundCustomers.length !== customerIds.length) {
      return Response.json({ error: "One or more customers were not found." }, { status: 404 });
    }

    await db.transaction(async (transaction) => {
      await transaction.insert(campaignRecipients).values(customerIds.map((customerId) => ({ campaignId, customerId })))
        .onConflictDoNothing({ target: [campaignRecipients.campaignId, campaignRecipients.customerId] });
      if (parsed.data.replaceExisting === true) {
        await transaction.delete(campaignRecipients).where(and(
          eq(campaignRecipients.campaignId, campaignId),
          notInArray(campaignRecipients.customerId, customerIds),
        ));
      }
    });
    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(readPgError(error));
  }
}

export async function DELETE(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;
  const parsed = await readJson<RecipientBody>(request);
  if ("response" in parsed) return parsed.response;
  const { campaignId, customerId } = parsed.data;
  const customerIds = parsed.data.customerIds === undefined ? null : readIds(parsed.data.customerIds);
  if (
    typeof campaignId !== "string" ||
    (customerId !== undefined && typeof customerId !== "string") ||
    (parsed.data.customerIds !== undefined && !customerIds) ||
    (customerId !== undefined && parsed.data.customerIds !== undefined)
  ) {
    return Response.json({ error: "Campaign ID and valid customer IDs are required." }, { status: 400 });
  }

  try {
    const campaign = await findOwnedCampaign(context.business.id, campaignId);
    if (!campaign) return Response.json({ error: "Campaign was not found." }, { status: 404 });
    const conditions = [eq(campaignRecipients.campaignId, campaignId)];
    if (typeof customerId === "string") conditions.push(eq(campaignRecipients.customerId, customerId));
    if (customerIds) conditions.push(inArray(campaignRecipients.customerId, customerIds));
    await db.delete(campaignRecipients).where(and(...conditions));
    return Response.json({ success: true });
  } catch (error) {
    return databaseErrorResponse(readPgError(error));
  }
}
