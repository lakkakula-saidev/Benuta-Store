"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMagentoProducts } from "../lib/magento";
import type { ProductFilter } from "../components/product-slider";

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
  const { data, isLoading, isError } = useQuery({
    queryKey: ["product-slider", categoryUids, sort, filter],
    queryFn: () =>
      fetchMagentoProducts({
        page: 1,
        pageSize: 30,
        sort,
        categoryUids,
        color: filter?.color
      })
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
