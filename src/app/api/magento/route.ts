import { NextResponse } from "next/server";
import {
  MAGENTO_ENDPOINT,
  MAGENTO_STORE_HEADER
} from "../../../lib/magento/constants";

type ProxyPayload = {
  query?: string;
  variables?: Record<string, unknown>;
  headers?: Record<string, string>;
};

export async function POST(request: Request) {
  if (!MAGENTO_ENDPOINT) {
    return NextResponse.json(
      { error: "Magento endpoint is not configured" },
      { status: 500 }
    );
  }

  let payload: ProxyPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  if (!payload?.query) {
    return NextResponse.json(
      { error: "Missing GraphQL query" },
      { status: 400 }
    );
  }

  const headers = {
    "Content-Type": "application/json",
    Store: MAGENTO_STORE_HEADER,
    ...(payload.headers ?? {})
  };

  try {
    const upstream = await fetch(MAGENTO_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: payload.query,
        variables: payload.variables
      })
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Magento proxy failed", error);
    return NextResponse.json(
      { error: "Failed to reach Magento" },
      { status: 502 }
    );
  }
}
