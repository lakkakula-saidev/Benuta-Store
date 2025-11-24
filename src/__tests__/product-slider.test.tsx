import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ShopListsProvider } from "../context/shop-lists";
import { describe, it, expect, vi } from "vitest";
import { ProductSlider } from "../components/product-slider";
import { RouteLoadingProvider } from "../context/route-loading";

vi.mock("../lib/magento", () => ({
  fetchMagentoProducts: vi.fn(() =>
    Promise.resolve({
      items: [
        {
          name: "Winter Rug",
          sku: "SKU-1",
          urlKey: "winter-rug",
          price: { value: 100, currency: "EUR" }
        },
        {
          name: "Summer Rug",
          sku: "SKU-2",
          urlKey: "summer-rug",
          price: { value: 120, currency: "EUR" }
        }
      ],
      saleItems: [],
      totalCount: 2,
      colorOptions: [],
      roomOptions: [],
      materialOptions: [],
      sizeOptions: []
    })
  )
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <RouteLoadingProvider>
        <ShopListsProvider>{ui}</ShopListsProvider>
      </RouteLoadingProvider>
    </QueryClientProvider>
  );
}

describe("ProductSlider", () => {
  it("renders loading skeletons initially", () => {
    const { container } = renderWithClient(
      <ProductSlider title="Test Slider" />
    );
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders products after data fetch", async () => {
    renderWithClient(<ProductSlider title="Test Slider" minimumItems={2} />);
    expect(await screen.findByText("Winter Rug")).toBeInTheDocument();
    expect(screen.getByText("Summer Rug")).toBeInTheDocument();
  });

  it("renders custom title", async () => {
    renderWithClient(<ProductSlider title="Custom Title" minimumItems={2} />);
    expect(await screen.findByText("Custom Title")).toBeInTheDocument();
  });

  it("applies filter correctly", async () => {
    renderWithClient(
      <ProductSlider
        title="Filtered Slider"
        filter={{ keyword: "winter" }}
        minimumItems={1}
      />
    );
    expect(await screen.findByText("Winter Rug")).toBeInTheDocument();
  });
});
