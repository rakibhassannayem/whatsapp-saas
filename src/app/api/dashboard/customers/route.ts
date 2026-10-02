import {
  databaseErrorResponse,
  getDashboardContext,
  readJson,
} from "@/lib/supabase/dashboard-api";

const phonePattern = /^\+[1-9][0-9]{1,14}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CustomerBody = Record<string, unknown>;

function readCustomerFields(body: CustomerBody) {
  const fullName =
    typeof body.full_name === "string" ? body.full_name.trim() : "";
  const phone =
    typeof body.phone_e164 === "string" ? body.phone_e164.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : null;

  if (
    !fullName ||
    fullName.length > 120 ||
    !phonePattern.test(phone) ||
    (body.email !== null &&
      body.email !== undefined &&
      typeof body.email !== "string") ||
    (email !== null && !emailPattern.test(email))
  ) {
    return null;
  }

  return { full_name: fullName, phone_e164: phone, email: email || null };
}

export async function POST(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;

  const parsed = await readJson<CustomerBody>(request);
  if ("response" in parsed) return parsed.response;
  const fields = readCustomerFields(parsed.data);

  if (!fields) {
    return Response.json(
      { error: "Customer details are invalid." },
      { status: 400 },
    );
  }

  const { data, error } = await context.supabase
    .from("customers")
    .insert({ ...fields, business_id: context.business.id })
    .select("id, full_name, phone_e164, email, created_at")
    .single();

  if (error) return databaseErrorResponse(error);
  return Response.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;

  const parsed = await readJson<CustomerBody>(request);
  if ("response" in parsed) return parsed.response;
  const id = parsed.data.id;
  const fields = readCustomerFields(parsed.data);

  if (typeof id !== "string" || !fields) {
    return Response.json(
      { error: "Customer details are invalid." },
      { status: 400 },
    );
  }

  const { data, error } = await context.supabase
    .from("customers")
    .update(fields)
    .eq("id", id)
    .eq("business_id", context.business.id)
    .select("id, full_name, phone_e164, email, created_at")
    .single();

  if (error) return databaseErrorResponse(error);
  return Response.json(data);
}

export async function DELETE(request: Request) {
  const context = await getDashboardContext();
  if ("response" in context) return context.response;

  const parsed = await readJson<CustomerBody>(request);
  if ("response" in parsed) return parsed.response;
  const id = parsed.data.id;

  if (typeof id !== "string") {
    return Response.json(
      { error: "Customer ID is required." },
      { status: 400 },
    );
  }

  const { error } = await context.supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("business_id", context.business.id);

  if (error) return databaseErrorResponse(error);
  return Response.json({ success: true });
}
