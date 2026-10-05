import {
  databaseErrorResponse,
  getDashboardContext,
  readJson,
} from "@/lib/supabase/dashboard-api";

type CampaignBody = Record<string, unknown>;

function readCampaignFields(body: CampaignBody) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const messageBody =
    typeof body.message_body === "string" ? body.message_body.trim() : "";

  if (!name || name.length > 100 || !messageBody) return null;
  return { name, message_body: messageBody };
}

export async function POST(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;

  const parsed = await readJson<CampaignBody>(request);
  if ("response" in parsed) return parsed.response;
  const fields = readCampaignFields(parsed.data);

  if (!fields) {
    return Response.json(
      { error: "Campaign name and message are required." },
      { status: 400 },
    );
  }

  const { data, error } = await context.supabase
    .from("campaigns")
    .insert({ business_id: context.business.id, ...fields })
    .select("id, name, message_body, status, created_at")
    .single();

  if (error)
    return databaseErrorResponse(error, "A campaign with this name already exists.");
  return Response.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;

  const parsed = await readJson<CampaignBody>(request);
  if ("response" in parsed) return parsed.response;
  const id = parsed.data.id;
  const fields = readCampaignFields(parsed.data);

  if (typeof id !== "string" || !fields) {
    return Response.json(
      { error: "Campaign details are invalid." },
      { status: 400 },
    );
  }

  const { data, error } = await context.supabase
    .from("campaigns")
    .update(fields)
    .eq("id", id)
    .eq("business_id", context.business.id)
    .select("id, name, message_body, status, created_at")
    .single();

  if (error)
    return databaseErrorResponse(error, "Another campaign with this name already exists.");
  return Response.json(data);
}

export async function DELETE(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;

  const parsed = await readJson<CampaignBody>(request);
  if ("response" in parsed) return parsed.response;
  const id = parsed.data.id;

  if (typeof id !== "string") {
    return Response.json(
      { error: "Campaign ID is required." },
      { status: 400 },
    );
  }

  const { error } = await context.supabase
    .from("campaigns")
    .delete()
    .eq("id", id)
    .eq("business_id", context.business.id);

  if (error) return databaseErrorResponse(error);
  return Response.json({ success: true });
}
