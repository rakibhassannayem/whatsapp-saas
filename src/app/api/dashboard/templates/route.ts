import {
  databaseErrorResponse,
  getDashboardContext,
  readJson,
} from "@/lib/supabase/dashboard-api";

type TemplateBody = Record<string, unknown>;

export async function POST(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;

  const parsed = await readJson<TemplateBody>(request);
  if ("response" in parsed) return parsed.response;
  const name =
    typeof parsed.data.name === "string" ? parsed.data.name.trim() : "";
  const body =
    typeof parsed.data.body === "string" ? parsed.data.body.trim() : "";

  if (!name || name.length > 100 || !body) {
    return Response.json(
      { error: "Template name and message are required." },
      { status: 400 },
    );
  }

  const { data, error } = await context.supabase
    .from("message_templates")
    .insert({ business_id: context.business.id, name, body })
    .select("id, name, body, created_at")
    .single();

  if (error)
    return databaseErrorResponse(error, "এই নামে template আগে থেকেই আছে।");
  return Response.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;

  const parsed = await readJson<TemplateBody>(request);
  if ("response" in parsed) return parsed.response;
  const id = parsed.data.id;

  if (typeof id !== "string") {
    return Response.json(
      { error: "Template ID is required." },
      { status: 400 },
    );
  }

  const { error } = await context.supabase
    .from("message_templates")
    .delete()
    .eq("id", id)
    .eq("business_id", context.business.id);

  if (error) return databaseErrorResponse(error);
  return Response.json({ success: true });
}
