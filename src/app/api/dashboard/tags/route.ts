import {
  databaseErrorResponse,
  getDashboardContext,
  readJson,
} from "@/lib/supabase/dashboard-api";

type TagBody = Record<string, unknown>;

export async function POST(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;

  const parsed = await readJson<TagBody>(request);
  if ("response" in parsed) return parsed.response;
  const name =
    typeof parsed.data.name === "string" ? parsed.data.name.trim() : "";

  if (!name || name.length > 50) {
    return Response.json(
      { error: "Tag name must be 1 to 50 characters." },
      { status: 400 },
    );
  }

  const { data, error } = await context.supabase
    .from("tags")
    .insert({ business_id: context.business.id, name })
    .select("id, name, created_at")
    .single();

  if (error) return databaseErrorResponse(error, "এই নামে tag ইতিমধ্যে আছে।");
  return Response.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;

  const parsed = await readJson<TagBody>(request);
  if ("response" in parsed) return parsed.response;
  const id = parsed.data.id;

  if (typeof id !== "string") {
    return Response.json({ error: "Tag ID is required." }, { status: 400 });
  }

  const { error } = await context.supabase
    .from("tags")
    .delete()
    .eq("id", id)
    .eq("business_id", context.business.id);

  if (error) return databaseErrorResponse(error);
  return Response.json({ success: true });
}
