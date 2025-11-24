import { MAGENTO_ENDPOINT } from "./magento/constants";

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
  next
}: RequestOptions): Promise<TData> {
  const normalizedHeaders = normalizeHeaders(headers);
  const mergedHeaders = {
    "Content-Type": "application/json",
    ...normalizedHeaders
  };

  const shouldProxy =
    typeof window !== "undefined" && endpoint === MAGENTO_ENDPOINT;

  const fetchTarget = shouldProxy ? "/api/magento" : endpoint;
  const body = shouldProxy
    ? JSON.stringify({
        query,
        variables,
        headers: mergedHeaders
      })
    : JSON.stringify({ query, variables });

  const response = await fetch(fetchTarget, {
    method: "POST",
    headers: shouldProxy ? { "Content-Type": "application/json" } : mergedHeaders,
    body,
    cache: shouldProxy ? undefined : cache,
    next: shouldProxy ? undefined : next
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

function normalizeHeaders(
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
  return headers as Record<string, string>;
}
