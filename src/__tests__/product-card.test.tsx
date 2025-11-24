import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect } from "vitest";
import { ProductCard } from "../components/product-card";
import { ShopListsProvider } from "../context/shop-lists";
import { RouteLoadingProvider } from "../context/route-loading";

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <RouteLoadingProvider>
        <ShopListsProvider>{ui}</ShopListsProvider>
      </RouteLoadingProvider>
    </QueryClientProvider>
  );
}

const product = {
  name: "Test Rug",
  sku: "TESTSKU",
  urlKey: "test-rug",
  imageUrl: null,
  price: { value: 199, currency: "EUR" },
  originalPrice: { value: 249, currency: "EUR" },
  badges: ["Sale"]
};

describe("ProductCard", () => {
  it("renders product name and price", () => {
    renderWithProviders(<ProductCard product={product} />);
    expect(screen.getByText("Test Rug")).toBeInTheDocument();
    expect(screen.getByText("Sale")).toBeInTheDocument();
  });

  it("shows placeholder when image missing", () => {
    const { getByText } = renderWithProviders(<ProductCard product={product} />);
    expect(getByText("No image")).toBeInTheDocument();
  });
});
