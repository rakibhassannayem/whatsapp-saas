import {
  databaseErrorResponse,
  getDashboardContext,
  readJson,
} from "@/lib/supabase/dashboard-api";

type CustomerTagBody = Record<string, unknown>;

async function getOwnedCustomerAndTag(
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >,
  businessId: string,
  customerId: string,
  tagId: string,
) {
  const [customer, tag] = await Promise.all([
    supabase
      .from("customers")
      .select("id")
      .eq("id", customerId)
      .eq("business_id", businessId)
      .maybeSingle(),
    supabase
      .from("tags")
      .select("id")
      .eq("id", tagId)
      .eq("business_id", businessId)
      .maybeSingle(),
  ]);

  if (customer.error) return customer.error;
  if (tag.error) return tag.error;
  if (!customer.data || !tag.data) return null;
  return true;
}

export async function POST(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;

  const parsed = await readJson<CustomerTagBody>(request);
  if ("response" in parsed) return parsed.response;
  const { customerId, tagId } = parsed.data;

  if (typeof customerId !== "string" || typeof tagId !== "string") {
    return Response.json(
      { error: "Customer and tag IDs are required." },
      { status: 400 },
    );
  }

  const ownership = await getOwnedCustomerAndTag(
    context.supabase,
    context.business.id,
    customerId,
    tagId,
  );
  if (ownership === null) {
    return Response.json(
      { error: "Customer or tag was not found." },
      { status: 404 },
    );
  }
  if (ownership !== true) return databaseErrorResponse(ownership);

  const { error } = await context.supabase.from("customer_tags").insert({
    business_id: context.business.id,
    customer_id: customerId,
    tag_id: tagId,
  });

  if (error) return databaseErrorResponse(error);
  return Response.json({ success: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;

  const parsed = await readJson<CustomerTagBody>(request);
  if ("response" in parsed) return parsed.response;
  const { customerId, tagId } = parsed.data;

  if (typeof customerId !== "string" || typeof tagId !== "string") {
    return Response.json(
      { error: "Customer and tag IDs are required." },
      { status: 400 },
    );
  }

  const ownership = await getOwnedCustomerAndTag(
    context.supabase,
    context.business.id,
    customerId,
    tagId,
  );
  if (ownership === null) {
    return Response.json(
      { error: "Customer or tag was not found." },
      { status: 404 },
    );
  }
  if (ownership !== true) return databaseErrorResponse(ownership);

  const { error } = await context.supabase
    .from("customer_tags")
    .delete()
    .eq("business_id", context.business.id)
    .eq("customer_id", customerId)
    .eq("tag_id", tagId);

  if (error) return databaseErrorResponse(error);
  return Response.json({ success: true });
}
