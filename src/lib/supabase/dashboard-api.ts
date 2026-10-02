import { createClient } from "@/lib/supabase/server";

export async function getDashboardContext() {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();

  if (authError || !auth?.claims) {
    return {
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (businessError) {
    return {
      response: Response.json(
        { error: businessError.message },
        { status: 500 },
      ),
    } as const;
  }

  if (!business) {
    return {
      response: Response.json(
        { error: "Create a business before using the dashboard." },
        { status: 404 },
      ),
    } as const;
  }

  return { supabase, business } as const;
}

export async function readJson<T extends Record<string, unknown>>(
  request: Request,
) {
  try {
    const data: unknown = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return {
        response: Response.json(
          { error: "Request body must be a JSON object." },
          { status: 400 },
        ),
      } as const;
    }
    return { data: data as T } as const;
  } catch {
    return {
      response: Response.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      ),
    } as const;
  }
}

export function databaseErrorResponse(
  error: { code?: string; message: string },
  duplicateMessage?: string,
) {
  const isDuplicate = error.code === "23505";
  return Response.json(
    {
      error: isDuplicate && duplicateMessage ? duplicateMessage : error.message,
    },
    { status: isDuplicate ? 409 : 500 },
  );
}
