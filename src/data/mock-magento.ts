import mockDataset from "./mock-magento.json";
import type { ProductSummary } from "../components/product-card";
import type {
  FetchProductsParams,
  ProductDetail
} from "../types/magento";

type FacetEntry = { label: string; value: string };

type MockProductRecord = {
  summary: ProductSummary;
  categoryUids: string[];
  facets: {
    colors: FacetEntry[];
    rooms: FacetEntry[];
    materials: FacetEntry[];
    sizes: FacetEntry[];
  };
  keywords?: string[];
};

type ProductListResponse = {
  items: ProductSummary[];
  saleItems: ProductSummary[];
  totalCount: number;
  colorOptions: Array<{ label: string; value: string; count?: number }>;
  roomOptions: Array<{ label: string; value: string; count?: number }>;
  materialOptions: Array<{ label: string; value: string; count?: number }>;
  sizeOptions: Array<{ label: string; value: string; count?: number }>;
  categoryOptions?: Array<{ label: string; value: string }>;
};

type FacetResponse = {
  colorOptions: Array<{ label: string; value: string; count?: number }>;
  roomOptions: Array<{ label: string; value: string; count?: number }>;
  materialOptions: Array<{ label: string; value: string; count?: number }>;
  sizeOptions: Array<{ label: string; value: string; count?: number }>;
};

type MockDataset = {
  categoryOptions: Array<{ label: string; value: string }>;
  products: MockProductRecord[];
};

const FALLBACK_IMAGE = "/sample-image.jpg";

const MOCK_DATA = mockDataset as MockDataset;
const MOCK_PRODUCT_RECORDS = MOCK_DATA.products;
const MOCK_CATEGORY_OPTIONS = MOCK_DATA.categoryOptions;



type FacetKey = keyof MockProductRecord["facets"];

const DETAIL_MAP = buildDetailMap();

function buildDetailMap() {
  const map = new Map<string, ProductDetail>();
  MOCK_PRODUCT_RECORDS.forEach((record) => {
    const detail = createProductDetail(record);
    const identifiers = new Set<string>();
    if (record.summary.urlKey) {
      identifiers.add(normalizeIdentifier(record.summary.urlKey));
    }
    identifiers.add(normalizeIdentifier(record.summary.sku));
    record.summary.variants?.forEach((variant) => {
      if (variant?.urlKey) {
        identifiers.add(normalizeIdentifier(variant.urlKey));
      }
      if (variant?.sku) {
        identifiers.add(normalizeIdentifier(variant.sku));
      }
    });
    identifiers.forEach((key) => {
      map.set(key, detail);
    });
  });
  return map;
}

function normalizeIdentifier(identifier: string | null | undefined) {
  if (!identifier) return "";
  return identifier
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/^p\//, "")
    .replace(/\.html?$/, "");
}

function createProductDetail(record: MockProductRecord): ProductDetail {
  const base = clone(record.summary);
  const gallery = [
    record.summary.imageUrl ?? FALLBACK_IMAGE,
    record.summary.hoverImageUrl ?? record.summary.imageUrl ?? FALLBACK_IMAGE
  ].filter(Boolean) as string[];
  const related = MOCK_PRODUCT_RECORDS.filter((item) => item !== record)
    .slice(0, 4)
    .map((item) => clone(item.summary));
  return {
    ...base,
    descriptionHtml: `<p>${record.summary.name} ist Teil der exklusiven Shopper Kollektion. Jeder Artikel wird handverlesen, um moderne Farben mit langlebigen Materialien zu kombinieren. Dieses Mock-Dataset bewahrt die Projektfunktionalität, selbst wenn die ursprüngliche Magento-API nicht verfügbar ist.</p>`,
    gallery: gallery.length ? gallery : [FALLBACK_IMAGE],
    relatedProducts: related,
    variantChoices: base.variants ?? undefined
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function filterByCategories(categoryUids?: string[]) {
  if (!categoryUids?.length) return MOCK_PRODUCT_RECORDS;
  return MOCK_PRODUCT_RECORDS.filter((record) =>
    record.categoryUids.some((uid) => categoryUids.includes(uid))
  );
}

function filterRecords(
  params: FetchProductsParams
): MockProductRecord[] {
  let records = filterByCategories(params.categoryUids);

  if (params.color) {
    records = records.filter((record) =>
      record.facets.colors.some((color) => color.value === params.color)
    );
  }

  if (params.rooms?.length) {
    records = records.filter((record) =>
      record.facets.rooms.some((room) => params.rooms!.includes(room.value))
    );
  }

  if (params.materials?.length) {
    records = records.filter((record) =>
      record.facets.materials.some((material) =>
        params.materials!.includes(material.value)
      )
    );
  }

  if (params.sizes?.length) {
    records = records.filter((record) =>
      record.facets.sizes.some((size) => params.sizes!.includes(size.value))
    );
  }

  const { from, to } = params.priceRange ?? {};
  if (from != null || to != null) {
    records = records.filter((record) => {
      const price = record.summary.price?.value ?? 0;
      if (from != null && price < from) return false;
      if (to != null && price > to) return false;
      return true;
    });
  }

  if (params.searchKeyword) {
    const keyword = params.searchKeyword.toLowerCase();
    records = records.filter((record) => {
      const name = record.summary.name?.toLowerCase() ?? "";
      const matchesName = name.includes(keyword);
      const matchesKeywords =
        record.keywords?.some((token) => token.toLowerCase().includes(keyword)) ??
        false;
      return matchesName || matchesKeywords;
    });
  }

  return records;
}

function buildFacetOptions(records: MockProductRecord[], key: FacetKey) {
  const counts = new Map<
    string,
    { label: string; value: string; count: number }
  >();
  records.forEach((record) => {
    record.facets[key].forEach((entry) => {
      const normalized = entry.value.toLowerCase();
      const existing = counts.get(normalized);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(normalized, {
          label: entry.label,
          value: entry.value,
          count: 1
        });
      }
    });
  });
  return Array.from(counts.values()).sort((a, b) =>
    a.label.localeCompare(b.label, "de")
  );
}

export function fetchMockMagentoProducts(
  params: FetchProductsParams
): ProductListResponse {
  const safePage = Math.max(1, params.page || 1);
  const pageSize = params.pageSize || 20;
  const filtered = filterRecords(params);
  const sorted = [...filtered].sort((a, b) => {
    const priceA = a.summary.price?.value ?? 0;
    const priceB = b.summary.price?.value ?? 0;
    return params.sort === "price_asc" ? priceA - priceB : priceB - priceA;
  });

  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;
  const paginated = sorted.slice(start, end);

  const items = paginated.map((record) => clone(record.summary));
  const saleItems = paginated
    .filter((record) =>
      record.summary.badges?.some(
        (badge) => badge?.toLowerCase() === "sale"
      )
    )
    .map((record) => clone(record.summary));

  const facetSource = filtered;

  return {
    items,
    saleItems,
    totalCount: sorted.length,
    colorOptions: buildFacetOptions(facetSource, "colors"),
    roomOptions: buildFacetOptions(facetSource, "rooms"),
    materialOptions: buildFacetOptions(facetSource, "materials"),
    sizeOptions: buildFacetOptions(facetSource, "sizes"),
    categoryOptions: MOCK_CATEGORY_OPTIONS
  };
}

export function fetchMockMagentoFacets(
  categoryUids?: string[]
): FacetResponse {
  const records = filterByCategories(categoryUids);
  return {
    colorOptions: buildFacetOptions(records, "colors"),
    roomOptions: buildFacetOptions(records, "rooms"),
    materialOptions: buildFacetOptions(records, "materials"),
    sizeOptions: buildFacetOptions(records, "sizes")
  };
}

export function fetchMockMagentoCategories(): Array<{
  label: string;
  value: string;
}> {
  return clone(MOCK_CATEGORY_OPTIONS);
}

export function fetchMockMagentoProductDetail(identifier: string) {
  const normalized = normalizeIdentifier(identifier);
  if (!normalized) return null;
  const match = DETAIL_MAP.get(normalized);
  return match ? clone(match) : null;
}
