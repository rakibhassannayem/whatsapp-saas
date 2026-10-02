type DashboardApiOptions = {
  method: "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

export async function dashboardApiRequest<T>(
  url: string,
  options: DashboardApiOptions,
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(url, {
      method: options.method,
      headers:
        options.body === undefined
          ? undefined
          : { "Content-Type": "application/json" },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const result = (await response.json().catch(() => null)) as {
      error?: unknown;
    } | null;

    if (!response.ok) {
      return {
        data: null,
        error:
          typeof result?.error === "string"
            ? result.error
            : "The request could not be completed.",
      };
    }

    return { data: result as T, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "The request could not be completed.",
    };
  }
}
