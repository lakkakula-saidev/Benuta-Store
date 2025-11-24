import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  fetchMagentoProducts,
  fetchMagentoFacets,
  fetchMagentoProductDetail
} from "../magento";
import type { FetchProductsParams } from "../../types/magento";

/**
 * Hook to fetch products with infinite scrolling.
 */
export function useProducts(params: Omit<FetchProductsParams, "page">) {
  return useInfiniteQuery({
    queryKey: ["products", params],
    queryFn: ({ pageParam = 1 }) =>
      fetchMagentoProducts({ ...params, page: pageParam }),
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
    queryFn: () => fetchMagentoFacets(categoryUids),
    staleTime: 10 * 60 * 1000
  });
}

/**
 * Hook to fetch product detail.
 */
export function useProductDetail(identifier: string) {
  return useQuery({
    queryKey: ["product", identifier],
    queryFn: () => fetchMagentoProductDetail(identifier),
    staleTime: 5 * 60 * 1000
  });
}
