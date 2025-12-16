type RequestOptions2 = {
  endpoint: string;
  query: string;
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: RequestInit["next"];
};

type GraphQLResponse<TData> = {
  data?: TData;
  error?: Array<{ message?: string }>;
};

export async function graphqlFetching<TData>({
  endpoint,
  query,
  headers,
  cache,
  next
}: RequestOptions2): Promise<TData> {
  const mergedHeaders = {
    "Content-Type": "application/json",
    ...headers
  };
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: mergedHeaders,
      body: JSON.stringify({ query }),
      cache,
      next
    });

    const json = (await response.json()) as GraphQLResponse<TData>;

    const hasErrors = json.error && json.error.length > 0;

    if (hasErrors) {
      throw new Error("GraphQL Fetching Error: " + json.error?.[0].message);
    }

    if (!response.ok) {
      throw new Error("GraphQL Fetching Error: " + json.error?.[0].message);
    }

    if (!json.data) throw new Error("No data returned from GraphQL");

    return {} as TData;
  } catch (error) {
    console.error("GraphQL fetching failed", error);
    throw new Error(`GraphQL request failed: ${error}`);
  }
}

export function normalizeHeaders(
  headers?: HeadersInit
): Record<string, string> | undefined {
  if (!headers) return undefined;
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return headers.reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }
}
