import { and, eq } from "drizzle-orm";
import {
  databaseErrorResponse,
  getDashboardContext,
  readJson,
} from "@/lib/supabase/dashboard-api";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";

const phonePattern = /^\+[1-9][0-9]{1,14}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type CustomerBody = Record<string, unknown>;

function readCustomerFields(body: CustomerBody) {
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const phone = typeof body.phone_e164 === "string" ? body.phone_e164.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : null;

  if (
    !fullName || fullName.length > 120 || !phonePattern.test(phone) ||
    (body.email !== null && body.email !== undefined && typeof body.email !== "string") ||
    (email !== null && !emailPattern.test(email))
  ) return null;

  return { fullName, phoneE164: phone, email: email || null };
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

function toCustomer(row: { id: string; fullName: string; phoneE164: string; email: string | null; createdAt: Date }) {
  return {
    id: row.id,
    full_name: row.fullName,
    phone_e164: row.phoneE164,
    email: row.email,
    created_at: row.createdAt.toISOString(),
  };
}

export async function POST(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;
  const parsed = await readJson<CustomerBody>(request);
  if ("response" in parsed) return parsed.response;
  const fields = readCustomerFields(parsed.data);
  if (!fields) return Response.json({ error: "Customer details are invalid." }, { status: 400 });

  try {
    const [row] = await db.insert(customers).values({ ...fields, businessId: context.business.id })
      .returning({ id: customers.id, fullName: customers.fullName, phoneE164: customers.phoneE164, email: customers.email, createdAt: customers.createdAt });
    if (!row) throw new Error("The database did not return the saved customer.");
    return Response.json(toCustomer(row), { status: 201 });
  } catch (error) {
    return databaseErrorResponse(readPgError(error), "A customer with this phone number already exists.");
  }
}

export async function PATCH(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;
  const parsed = await readJson<CustomerBody>(request);
  if ("response" in parsed) return parsed.response;
  const id = parsed.data.id;
  const fields = readCustomerFields(parsed.data);
  if (typeof id !== "string" || !fields) return Response.json({ error: "Customer details are invalid." }, { status: 400 });

  try {
    const [row] = await db.update(customers).set(fields)
      .where(and(eq(customers.id, id), eq(customers.businessId, context.business.id)))
      .returning({ id: customers.id, fullName: customers.fullName, phoneE164: customers.phoneE164, email: customers.email, createdAt: customers.createdAt });
    if (!row) return Response.json({ error: "Customer was not found." }, { status: 404 });
    return Response.json(toCustomer(row));
  } catch (error) {
    return databaseErrorResponse(readPgError(error), "A customer with this phone number already exists.");
  }
}

export async function DELETE(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;
  const parsed = await readJson<CustomerBody>(request);
  if ("response" in parsed) return parsed.response;
  const id = parsed.data.id;
  if (typeof id !== "string") return Response.json({ error: "Customer ID is required." }, { status: 400 });

  try {
    const [deleted] = await db.delete(customers)
      .where(and(eq(customers.id, id), eq(customers.businessId, context.business.id)))
      .returning({ id: customers.id });
    if (!deleted) return Response.json({ error: "Customer was not found." }, { status: 404 });
    return Response.json({ success: true });
  } catch (error) {
    return databaseErrorResponse(readPgError(error));
  }
}
