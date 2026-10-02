import {
  databaseErrorResponse,
  getDashboardContext,
  readJson,
} from "@/lib/supabase/dashboard-api";

const phonePattern = /^\+[1-9][0-9]{1,14}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxRows = 1000;

type ImportBody = Record<string, unknown>;

export async function POST(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;

  const parsed = await readJson<ImportBody>(request);
  if ("response" in parsed) return parsed.response;
  const rows = parsed.data.rows;

  if (!Array.isArray(rows) || rows.length === 0 || rows.length > maxRows) {
    return Response.json(
      { error: `Import must contain between 1 and ${maxRows} rows.` },
      { status: 400 },
    );
  }

  const customerRows = [];
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      return Response.json(
        { error: "An import row is invalid." },
        { status: 400 },
      );
    }

    const value = row as Record<string, unknown>;
    const fullName =
      typeof value.full_name === "string" ? value.full_name.trim() : "";
    const phone =
      typeof value.phone_e164 === "string" ? value.phone_e164.trim() : "";
    const email = typeof value.email === "string" ? value.email.trim() : null;

    if (
      !fullName ||
      fullName.length > 120 ||
      !phonePattern.test(phone) ||
      (value.email !== null &&
        value.email !== undefined &&
        typeof value.email !== "string") ||
      (email !== null && !emailPattern.test(email))
    ) {
      return Response.json(
        { error: "An import row contains invalid customer details." },
        { status: 400 },
      );
    }

    customerRows.push({
      business_id: context.business.id,
      full_name: fullName,
      phone_e164: phone,
      email: email || null,
    });
  }

  const { data, error } = await context.supabase
    .from("customers")
    .upsert(customerRows, {
      onConflict: "business_id,phone_e164",
      ignoreDuplicates: true,
    })
    .select("id");

  if (error) return databaseErrorResponse(error);
  return Response.json({ addedCount: data?.length ?? 0 });
}
