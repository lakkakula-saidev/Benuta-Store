import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { FetchProductsParams } from "../../types/magento";

/**
 * Hook to fetch products with infinite scrolling.
 */
export function useProducts(params: Omit<FetchProductsParams, "page">) {
  return useInfiniteQuery({
    queryKey: ["products", params],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams({
        pageSize: params.pageSize.toString(),
        page: pageParam.toString(),
        sort: params.sort,
        ...(params.color && { color: params.color }),
        ...(params.priceRange?.from && {
          priceFrom: params.priceRange.from.toString()
        }),
        ...(params.priceRange?.to && {
          priceTo: params.priceRange.to.toString()
        }),
        ...(params.rooms && { rooms: params.rooms.join(",") }),
        ...(params.materials && { materials: params.materials.join(",") }),
        ...(params.sizes && { sizes: params.sizes.join(",") }),
        ...(params.categoryUids && {
          categoryUids: params.categoryUids.join(",")
        }),
        ...(params.searchKeyword && { searchKeyword: params.searchKeyword })
      });

      const response = await fetch(`/api/products?${searchParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.length * params.pageSize;
      if (loaded < lastPage.totalCount) {
        return allPages.length + 1;
      }
      return undefined;
    },
    staleTime: 60_000,
    placeholderData: (prev) => prev
  });
}

/**
 * Hook to fetch product facets.
 */
export function useFacets(categoryUids?: string[]) {
  return useQuery({
    queryKey: ["facets", categoryUids?.join(",") ?? "all"],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (categoryUids) {
        searchParams.set("categoryUids", categoryUids.join(","));
      }

      const response = await fetch(`/api/facets?${searchParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch facets");
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000
  });
}

/**
 * Hook to fetch product detail.
 */
export function useProductDetail(identifier: string) {
  return useQuery({
    queryKey: ["product", identifier],
    queryFn: async () => {
      const response = await fetch(
        `/api/product/${encodeURIComponent(identifier)}`
      );
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Product not found");
        }
        throw new Error("Failed to fetch product details");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000
  });
}
