import { NextRequest, NextResponse } from "next/server";
import { fetchMagentoProducts } from "../../../lib/magento";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params = {
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      page: parseInt(searchParams.get("page") || "1"),
      sort:
        (searchParams.get("sort") as "price_asc" | "price_desc") || "price_asc",
      color: searchParams.get("color") || undefined,
      priceRange:
        searchParams.get("priceFrom") || searchParams.get("priceTo")
          ? {
              from: searchParams.get("priceFrom")
                ? parseInt(searchParams.get("priceFrom")!)
                : undefined,
              to: searchParams.get("priceTo")
                ? parseInt(searchParams.get("priceTo")!)
                : undefined
            }
          : undefined,
      rooms: searchParams.get("rooms")?.split(",") || undefined,
      materials: searchParams.get("materials")?.split(",") || undefined,
      sizes: searchParams.get("sizes")?.split(",") || undefined,
      categoryUids: searchParams.get("categoryUids")?.split(",") || undefined,
      searchKeyword: searchParams.get("searchKeyword") || undefined
    };

    const data = await fetchMagentoProducts(params);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
