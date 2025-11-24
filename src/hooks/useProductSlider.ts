"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ProductFilter } from "../components/product-slider";
import type { ProductSummary } from "../components/product-card";

export function useProductSlider({
  sort,
  categoryUids,
  filter,
  minimumItems = 8
}: {
  sort: "price_asc" | "price_desc";
  categoryUids?: string[];
  filter?: ProductFilter;
  minimumItems?: number;
}) {
  const { data, isLoading, isError } = useQuery<{
    items: ProductSummary[];
    saleItems: ProductSummary[];
    totalCount: number;
    colorOptions: Array<{ label: string; value: string; count?: number }>;
    roomOptions: Array<{ label: string; value: string; count?: number }>;
    materialOptions: Array<{ label: string; value: string; count?: number }>;
    sizeOptions: Array<{ label: string; value: string; count?: number }>;
  }>({
    queryKey: ["product-slider", categoryUids, sort, filter],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        pageSize: "30",
        page: "1",
        sort,
        ...(categoryUids && { categoryUids: categoryUids.join(",") }),
        ...(filter?.color && { color: filter.color })
      });

      const response = await fetch(`/api/products?${searchParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    }
  });

  const sale = filter?.sale;
  const badge = filter?.badge;
  const keyword = filter?.keyword;

  const products = useMemo(() => {
    if (!data) return [];
    let list = sale ? data.saleItems : data.items;
    if (badge) {
      const badgeLower = badge.toLowerCase();
      list = list.filter((product) =>
        product.badges?.some((b) => b?.toLowerCase() === badgeLower)
      );
    }
    if (keyword) {
      const key = keyword.toLowerCase();
      list = list.filter((product) =>
        product.name?.toLowerCase().includes(key)
      );
    }
    if (minimumItems && list.length < minimumItems) {
      const filler = data.items.filter((product) => !list.includes(product));
      list = [...list, ...filler].slice(0, minimumItems);
    }
    return list;
  }, [data, sale, badge, keyword, minimumItems]);

  return {
    products,
    isLoading,
    isError,
    sale,
    badge,
    keyword
  };
}
