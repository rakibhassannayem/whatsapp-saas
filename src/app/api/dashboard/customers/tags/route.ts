import { and, eq, inArray } from "drizzle-orm";
import {
  databaseErrorResponse,
  getDashboardContext,
  readJson,
} from "@/lib/supabase/dashboard-api";
import { db } from "@/lib/db";
import { customerTags, customers, tags } from "@/lib/db/schema";

type CustomerTagBody = Record<string, unknown>;
const maxCustomersPerRequest = 1000;

function readPgError(error: unknown) {
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    return {
      code: typeof error.code === "string" ? error.code : undefined,
      message: typeof error.message === "string" ? error.message : "Database request failed.",
    };
  }
  return { message: error instanceof Error ? error.message : "Database request failed." };
}

function readCustomerIds(body: CustomerTagBody) {
  const value = Array.isArray(body.customerIds) ? body.customerIds :
    typeof body.customerId === "string" ? [body.customerId] : null;
  if (!value || value.length === 0 || value.length > maxCustomersPerRequest || value.some((id) => typeof id !== "string")) return null;
  return [...new Set(value as string[])];
}

async function validateEntities(businessId: string, tagId: string, customerIds: string[]) {
  const [ownedTag] = await db.select({ id: tags.id }).from(tags).where(and(
    eq(tags.id, tagId), eq(tags.businessId, businessId),
  )).limit(1);
  if (!ownedTag) return { response: Response.json({ error: "Tag was not found." }, { status: 404 }) } as const;

  const ownedCustomers = await db.select({ id: customers.id }).from(customers).where(and(
    eq(customers.businessId, businessId), inArray(customers.id, customerIds),
  ));
  if (ownedCustomers.length !== customerIds.length) {
    return { response: Response.json({ error: "One or more customers were not found." }, { status: 404 }) } as const;
  }
  return { ok: true } as const;
}

async function changeCustomerTags(request: Request, action: "add" | "remove") {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;
  const parsed = await readJson<CustomerTagBody>(request);
  if ("response" in parsed) return parsed.response;
  const tagId = parsed.data.tagId;
  const customerIds = readCustomerIds(parsed.data);
  if (typeof tagId !== "string" || !customerIds) {
    return Response.json({ error: "Tag and customer IDs are required." }, { status: 400 });
  }

  try {
    const validation = await validateEntities(context.business.id, tagId, customerIds);
    if ("response" in validation) return validation.response;

    if (action === "add") {
      const rows = await db.insert(customerTags).values(customerIds.map((customerId) => ({
        businessId: context.business.id, customerId, tagId,
      }))).onConflictDoNothing().returning({ customerId: customerTags.customerId });
      return Response.json({
        addedCount: rows.length,
        skippedCount: customerIds.length - rows.length,
      }, { status: rows.length ? 201 : 200 });
    }

    const rows = await db.delete(customerTags).where(and(
      eq(customerTags.businessId, context.business.id),
      eq(customerTags.tagId, tagId),
      inArray(customerTags.customerId, customerIds),
    )).returning({ customerId: customerTags.customerId });
    return Response.json({ removedCount: rows.length });
  } catch (error) {
    return databaseErrorResponse(readPgError(error));
  }
}

export async function POST(request: Request) {
  return changeCustomerTags(request, "add");
}

export async function DELETE(request: Request) {
  return changeCustomerTags(request, "remove");
}
