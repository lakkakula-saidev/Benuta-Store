import { NextRequest, NextResponse } from "next/server";
import { fetchMagentoFacets } from "../../../lib/magento";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const categoryUids =
      searchParams.get("categoryUids")?.split(",") || undefined;

    const data = await fetchMagentoFacets(categoryUids);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Facets API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch facets" },
      { status: 500 }
    );
  }
}
