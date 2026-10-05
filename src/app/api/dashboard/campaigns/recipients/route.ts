import {
  databaseErrorResponse,
  getDashboardContext,
  readJson,
} from "@/lib/supabase/dashboard-api";

type RecipientBody = Record<string, unknown>;

async function getOwnedCampaign(
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >,
  businessId: string,
  campaignId: string,
) {
  const { data, error } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", campaignId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) return { kind: "error", error } as const;
  if (!data) return { kind: "missing" } as const;
  return { kind: "found", campaign: data } as const;
}

export async function POST(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;

  const parsed = await readJson<RecipientBody>(request);
  if ("response" in parsed) return parsed.response;
  const { campaignId, customerIds } = parsed.data;

  if (
    typeof campaignId !== "string" ||
    !Array.isArray(customerIds) ||
    customerIds.length === 0 ||
    customerIds.some((id) => typeof id !== "string")
  ) {
    return Response.json(
      { error: "Campaign and customer IDs are required." },
      { status: 400 },
    );
  }

  const ownedCampaign = await getOwnedCampaign(
    context.supabase,
    context.business.id,
    campaignId,
  );
  if (ownedCampaign.kind === "error") {
    return databaseErrorResponse(ownedCampaign.error);
  }
  if (ownedCampaign.kind === "missing") {
    return Response.json({ error: "Campaign was not found." }, { status: 404 });
  }

  const uniqueCustomerIds = [...new Set(customerIds as string[])];
  const { data: customers, error: customersError } = await context.supabase
    .from("customers")
    .select("id")
    .eq("business_id", context.business.id)
    .in("id", uniqueCustomerIds);

  if (customersError) return databaseErrorResponse(customersError);
  if (customers?.length !== uniqueCustomerIds.length) {
    return Response.json(
      { error: "One or more customers were not found." },
      { status: 404 },
    );
  }

  const { error: addRecipientsError } = await context.supabase
    .from("campaign_recipients")
    .upsert(
      uniqueCustomerIds.map((customerId) => ({
        campaign_id: campaignId,
        customer_id: customerId,
      })),
      { onConflict: "campaign_id,customer_id", ignoreDuplicates: true },
    );

  if (addRecipientsError) return databaseErrorResponse(addRecipientsError);

  if (parsed.data.replaceExisting === true) {
    const { error: removeRecipientsError } = await context.supabase
      .from("campaign_recipients")
      .delete()
      .eq("campaign_id", campaignId)
      .not("customer_id", "in", `(${uniqueCustomerIds.join(",")})`);

    if (removeRecipientsError) {
      return databaseErrorResponse(removeRecipientsError);
    }
  }

  return Response.json({ success: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;

  const parsed = await readJson<RecipientBody>(request);
  if ("response" in parsed) return parsed.response;
  const { campaignId, customerId, customerIds } = parsed.data;

  if (
    typeof campaignId !== "string" ||
    (customerId !== undefined && typeof customerId !== "string") ||
    (customerIds !== undefined &&
      (!Array.isArray(customerIds) ||
        customerIds.length === 0 ||
        customerIds.some((id) => typeof id !== "string"))) ||
    (customerId !== undefined && customerIds !== undefined)
  ) {
    return Response.json(
      { error: "Campaign ID and valid customer IDs are required." },
      { status: 400 },
    );
  }

  const ownedCampaign = await getOwnedCampaign(
    context.supabase,
    context.business.id,
    campaignId,
  );
  if (ownedCampaign.kind === "error") {
    return databaseErrorResponse(ownedCampaign.error);
  }
  if (ownedCampaign.kind === "missing") {
    return Response.json({ error: "Campaign was not found." }, { status: 404 });
  }

  let query = context.supabase
    .from("campaign_recipients")
    .delete()
    .eq("campaign_id", campaignId);
  if (typeof customerId === "string")
    query = query.eq("customer_id", customerId);
  if (Array.isArray(customerIds)) {
    query = query.in("customer_id", [...new Set(customerIds as string[])]);
  }

  const { error } = await query;
  if (error) return databaseErrorResponse(error);
  return Response.json({ success: true });
}
