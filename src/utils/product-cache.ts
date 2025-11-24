"use client";

import type { ProductSummary } from "../components/product-card";

const CACHE_KEY = "pdp_product_cache";

type CachedMap = Record<string, ProductSummary>;

function readCache(): CachedMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as CachedMap;
    }
  } catch {
    // ignore
  }
  return {};
}

function writeCache(map: CachedMap) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function cacheProductSnapshot(
  slug: string | null | undefined,
  product: ProductSummary
) {
  if (!slug) return;
  const map = readCache();
  map[slug] = product;
  writeCache(map);
}

export function loadProductSnapshot(
  slug: string | null | undefined
): ProductSummary | null {
  if (!slug) return null;
  const map = readCache();
  return map[slug] ?? null;
}
