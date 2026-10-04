import {
  databaseErrorResponse,
  getDashboardContext,
  readJson,
} from "@/lib/supabase/dashboard-api";

type CustomerTagBody = Record<string, unknown>;

const maxCustomersPerRequest = 1000;
const chunkSize = 200;

function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function readCustomerIds(body: CustomerTagBody) {
  if (Array.isArray(body.customerIds)) {
    if (body.customerIds.length === 0) return null;
    if (body.customerIds.length > maxCustomersPerRequest) return null;
    if (body.customerIds.some((id) => typeof id !== "string")) return null;
    return [...new Set(body.customerIds as string[])];
  }

  if (typeof body.customerId === "string") return [body.customerId];
  return null;
}

type SupabaseServerClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

async function getOwnedTag(
  supabase: SupabaseServerClient,
  businessId: string,
  tagId: string,
) {
  const { data, error } = await supabase
    .from("tags")
    .select("id")
    .eq("id", tagId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) return { kind: "error", error } as const;
  if (!data) return { kind: "missing" } as const;
  return { kind: "found" } as const;
}

async function getOwnedCustomerIds(
  supabase: SupabaseServerClient,
  businessId: string,
  customerIds: string[],
) {
  const found = new Set<string>();

  for (const ids of chunk(customerIds, chunkSize)) {
    const { data, error } = await supabase
      .from("customers")
      .select("id")
      .eq("business_id", businessId)
      .in("id", ids);

    if (error) return { kind: "error", error } as const;
    (data ?? []).forEach((row) => found.add(row.id));
  }

  if (customerIds.some((id) => !found.has(id))) {
    return { kind: "missing" } as const;
  }
  return { kind: "found" } as const;
}

async function getExistingCustomerIds(
  supabase: SupabaseServerClient,
  businessId: string,
  tagId: string,
  customerIds: string[],
) {
  const existing = new Set<string>();

  for (const ids of chunk(customerIds, chunkSize)) {
    const { data, error } = await supabase
      .from("customer_tags")
      .select("customer_id")
      .eq("business_id", businessId)
      .eq("tag_id", tagId)
      .in("customer_id", ids);

    if (error) return { kind: "error", error } as const;
    (data ?? []).forEach((row) => existing.add(row.customer_id));
  }

  return { kind: "found", existing } as const;
}

export async function POST(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;

  const parsed = await readJson<CustomerTagBody>(request);
  if ("response" in parsed) return parsed.response;
  const { tagId } = parsed.data;
  const customerIds = readCustomerIds(parsed.data);

  if (typeof tagId !== "string" || !customerIds) {
    return Response.json(
      { error: "Tag and customer IDs are required." },
      { status: 400 },
    );
  }

  const ownedTag = await getOwnedTag(
    context.supabase,
    context.business.id,
    tagId,
  );
  if (ownedTag.kind === "error") return databaseErrorResponse(ownedTag.error);
  if (ownedTag.kind === "missing") {
    return Response.json({ error: "Tag was not found." }, { status: 404 });
  }

  const ownership = await getOwnedCustomerIds(
    context.supabase,
    context.business.id,
    customerIds,
  );
  if (ownership.kind === "error") {
    return databaseErrorResponse(ownership.error);
  }
  if (ownership.kind === "missing") {
    return Response.json(
      { error: "One or more customers were not found." },
      { status: 404 },
    );
  }

  const existingResult = await getExistingCustomerIds(
    context.supabase,
    context.business.id,
    tagId,
    customerIds,
  );
  if (existingResult.kind === "error") {
    return databaseErrorResponse(existingResult.error);
  }

  const missingIds = customerIds.filter(
    (customerId) => !existingResult.existing.has(customerId),
  );

  if (missingIds.length === 0) {
    return Response.json({ addedCount: 0, skippedCount: customerIds.length });
  }

  let addedCount = 0;

  for (const ids of chunk(missingIds, chunkSize)) {
    const { data, error } = await context.supabase
      .from("customer_tags")
      .insert(
        ids.map((customerId) => ({
          business_id: context.business.id,
          customer_id: customerId,
          tag_id: tagId,
        })),
      )
      .select("customer_id");

    if (error) return databaseErrorResponse(error);
    addedCount += data?.length ?? 0;
  }

  return Response.json(
    { addedCount, skippedCount: customerIds.length - addedCount },
    { status: 201 },
  );
}

export async function DELETE(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;

  const parsed = await readJson<CustomerTagBody>(request);
  if ("response" in parsed) return parsed.response;
  const { tagId } = parsed.data;
  const customerIds = readCustomerIds(parsed.data);

  if (typeof tagId !== "string" || !customerIds) {
    return Response.json(
      { error: "Tag and customer IDs are required." },
      { status: 400 },
    );
  }

  const ownedTag = await getOwnedTag(
    context.supabase,
    context.business.id,
    tagId,
  );
  if (ownedTag.kind === "error") return databaseErrorResponse(ownedTag.error);
  if (ownedTag.kind === "missing") {
    return Response.json({ error: "Tag was not found." }, { status: 404 });
  }

  const ownership = await getOwnedCustomerIds(
    context.supabase,
    context.business.id,
    customerIds,
  );
  if (ownership.kind === "error") {
    return databaseErrorResponse(ownership.error);
  }
  if (ownership.kind === "missing") {
    return Response.json(
      { error: "One or more customers were not found." },
      { status: 404 },
    );
  }

  let removedCount = 0;

  for (const ids of chunk(customerIds, chunkSize)) {
    const { data, error } = await context.supabase
      .from("customer_tags")
      .delete()
      .eq("business_id", context.business.id)
      .eq("tag_id", tagId)
      .in("customer_id", ids)
      .select("customer_id");

    if (error) return databaseErrorResponse(error);
    removedCount += data?.length ?? 0;
  }

  return Response.json({ removedCount });
}
