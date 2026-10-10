import { and, eq, inArray } from "drizzle-orm";
import {
  databaseErrorResponse,
  getDashboardContext,
  readJson,
} from "@/lib/supabase/dashboard-api";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";

const phonePattern = /^\+[1-9][0-9]{1,14}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxRows = 1000;
type ImportBody = Record<string, unknown>;

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
  const parsed = await readJson<ImportBody>(request);
  if ("response" in parsed) return parsed.response;
  const rows = parsed.data.rows;
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > maxRows) {
    return Response.json({ error: `Import must contain between 1 and ${maxRows} rows.` }, { status: 400 });
  }

  const customerRows: { fullName: string; phoneE164: string; email: string | null }[] = [];
  const seenPhones = new Set<string>();
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      return Response.json({ error: "An import row is invalid." }, { status: 400 });
    }
    const value = row as Record<string, unknown>;
    const fullName = typeof value.full_name === "string" ? value.full_name.trim() : "";
    const phoneE164 = typeof value.phone_e164 === "string" ? value.phone_e164.trim() : "";
    const email = typeof value.email === "string" ? value.email.trim() : null;
    if (
      !fullName || fullName.length > 120 || !phonePattern.test(phoneE164) || seenPhones.has(phoneE164) ||
      (value.email !== null && value.email !== undefined && typeof value.email !== "string") ||
      (email !== null && !emailPattern.test(email))
    ) {
      return Response.json({ error: "An import row contains invalid customer details." }, { status: 400 });
    }
    seenPhones.add(phoneE164);
    customerRows.push({ fullName, phoneE164, email: email || null });
  }

  try {
    const result = await db.transaction(async (transaction) => {
      const inserted = await transaction.insert(customers)
        .values(customerRows.map((row) => ({ ...row, businessId: context.business.id })))
        .onConflictDoNothing({ target: [customers.businessId, customers.phoneE164] })
        .returning({ id: customers.id });

      const matched = await transaction.select({
        id: customers.id,
        fullName: customers.fullName,
        phoneE164: customers.phoneE164,
        email: customers.email,
      }).from(customers).where(and(
        eq(customers.businessId, context.business.id),
        inArray(customers.phoneE164, customerRows.map((row) => row.phoneE164)),
      ));

      if (matched.length !== customerRows.length) {
        throw new Error("Could not find every imported customer after saving them.");
      }

      return { inserted, matched };
    });

    return Response.json({
      addedCount: result.inserted.length,
      customerIds: result.inserted.map((row) => row.id),
      matchedCustomers: result.matched.map((row) => ({
        id: row.id,
        full_name: row.fullName,
        phone_e164: row.phoneE164,
        email: row.email,
      })),
    });
  } catch (error) {
    return databaseErrorResponse(readPgError(error));
  }
}
