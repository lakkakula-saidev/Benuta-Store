type RequestOptions = {
  endpoint: string;
  query: string;
  variables?: Record<string, unknown>;
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: RequestInit["next"];
};

type GraphQLResponse<TData> = {
  data?: TData;
  errors?: Array<{ message?: string }>;
};

/**
 * Shared GraphQL fetcher to keep Magento/Contentful calls consistent.
 */
export async function graphqlFetch<TData>({
  endpoint,
  query,
  variables,
  headers,
  cache = "no-store",
  next,
}: RequestOptions): Promise<TData> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ query, variables }),
    cache,
    next,
  });

  const json = (await response.json()) as GraphQLResponse<TData>;

  const hasErrors = json.errors?.length;
  if (hasErrors) {
    console.warn("GraphQL partial errors", json.errors);
  }

  if (!response.ok) {
    const message =
      json.errors?.[0]?.message ?? response.statusText ?? "Unknown error";
    console.error("GraphQL fetch failed", { status: response.status, errors: json.errors });
    throw new Error(`GraphQL request failed: ${message}`);
  }

  if (!json.data) {
    const message = json.errors?.[0]?.message ?? "empty response";
    console.error("GraphQL empty data", { errors: json.errors });
    throw new Error(`GraphQL request failed: ${message}`);
  }

  return json.data;
}
