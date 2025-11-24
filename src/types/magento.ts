export type FetchProductsParams = {
  page: number;
  pageSize: number;
  sort: "price_asc" | "price_desc";
  color?: string;
  rooms?: string[];
  materials?: string[];
  sizes?: string[];
  categoryUids?: string[];
  priceRange?: { from?: number; to?: number };
  searchKeyword?: string;
};

export type MagentoMoney = {
  value: number;
  currency: string;
};

export type MagentoConfigurableOption = {
  attribute_code?: string | null;
  label?: string | null;
  values?: Array<{ value_index?: number | null; label?: string | null } | null>;
};

export type MagentoVariant = {
  product?: MagentoProduct | null;
  attributes?: Array<{ code?: string | null; value_index?: number | null }>;
};

export type MagentoProduct = {
  name: string;
  sku: string;
  url_key: string | null;
  url_suffix?: string | null;
  small_image?: { url: string | null } | null;
  media_gallery?: Array<{ url?: string | null } | null> | null;
  price_range?: {
    minimum_price?: {
      final_price?: MagentoMoney | null;
      regular_price?: MagentoMoney | null;
    } | null;
  } | null;
  stock_status?: string | null;
  short_description?: { html: string | null } | null;
  description?: { html: string | null } | null;
  __typename?: string;
  configurable_options?: MagentoConfigurableOption[] | null;
  variants?: MagentoVariant[] | null;
};

export type ProductsQueryResponse = {
  products: {
    items: MagentoProduct[];
    total_count: number;
    aggregations?: Array<{
      attribute_code?: string | null;
      label?: string | null;
      options?: Array<{
        label?: string | null;
        value?: string | null;
        count?: number | null;
      } | null>;
    }>;
  };
};

export type UrlResolverResponse = {
  urlResolver?: {
    canonical_url?: string | null;
    relative_url?: string | null;
    type?: string | null;
  } | null;
};

export type ProductDetail = import("../components/product-card").ProductSummary & {
  descriptionHtml?: string | null;
  gallery: string[];
  relatedProducts?: import("../components/product-card").ProductSummary[];
  variantChoices?: import("../components/product-card").ProductSummary["variants"];
};
