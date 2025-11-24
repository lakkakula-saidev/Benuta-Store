"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { ShopListsProvider } from "../context/shop-lists";
import { RouteLoadingProvider } from "../context/route-loading";

export function Providers({ children }: { children: React.ReactNode }) {
  // Create client once per provider to keep cache stable across renders.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RouteLoadingProvider>
        <ShopListsProvider>{children}</ShopListsProvider>
      </RouteLoadingProvider>
     {process.env.NODE_ENV === "development" && (
       <ReactQueryDevtools initialIsOpen={false} />
     )}
    </QueryClientProvider>
  );
}
