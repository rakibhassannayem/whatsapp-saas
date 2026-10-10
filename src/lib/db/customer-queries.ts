import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { customerTags, customers, tags } from "@/lib/db/schema";

export async function getBusinessCustomers(businessId: string, sortByName = false) {
  const rows = await db.select({
    id: customers.id,
    fullName: customers.fullName,
    phoneE164: customers.phoneE164,
    email: customers.email,
    createdAt: customers.createdAt,
  }).from(customers).where(eq(customers.businessId, businessId)).orderBy(
    sortByName ? asc(customers.fullName) : desc(customers.createdAt),
  );
  return rows.map((row) => ({
    id: row.id,
    full_name: row.fullName,
    phone_e164: row.phoneE164,
    email: row.email,
    ...(sortByName ? {} : { created_at: row.createdAt.toISOString() }),
  }));
}

export async function getBusinessTags(businessId: string) {
  const rows = await db.select({
    id: tags.id,
    name: tags.name,
    createdAt: tags.createdAt,
  }).from(tags).where(eq(tags.businessId, businessId)).orderBy(asc(tags.name));
  return rows.map((row) => ({ id: row.id, name: row.name, created_at: row.createdAt.toISOString() }));
}

export async function getBusinessCustomerTags(businessId: string) {
  const rows = await db.select({
    customer_id: customerTags.customerId,
    tag_id: customerTags.tagId,
  }).from(customerTags).where(eq(customerTags.businessId, businessId));
  return rows;
}
