import { graphqlFetch } from "./graphql-client";
import type { ProductSummary } from "../components/product-card";
import type {
  FetchProductsParams,
  MagentoProduct,
  ProductsQueryResponse,
  UrlResolverResponse,
  ProductDetail
} from "../types/magento";
import {
  MAGENTO_ENDPOINT,
  MAGENTO_STORE_HEADER,
  COLOR_ATTRIBUTE,
  ROOM_ATTRIBUTE,
  MATERIAL_ATTRIBUTE,
  SIZE_ATTRIBUTE
} from "./magento/constants";
import {
  cleanGallery,
  findAggregation,
  groupProductsByName,
  isConfigurableWithVariants,
  mapAggregationOptions,
  mapProductToSummary,
  mapVariantsWithSizes
} from "./magento/helpers";

export type { ProductDetail } from "../types/magento";

export async function fetchMagentoProducts(
  params: FetchProductsParams
): Promise<{
  items: ProductSummary[];
  saleItems: ProductSummary[];
  totalCount: number;
  colorOptions: Array<{ label: string; value: string; count?: number }>;
  roomOptions: Array<{ label: string; value: string; count?: number }>;
  materialOptions: Array<{ label: string; value: string; count?: number }>;
  sizeOptions: Array<{ label: string; value: string; count?: number }>;
  categoryOptions?: Array<{ label: string; value: string }>;
}> {
  const query = /* GraphQL */ `
    query Products(
      $pageSize: Int
      $currentPage: Int
      $sort: ProductAttributeSortInput
      $filter: ProductAttributeFilterInput
    ) {
      products(
        pageSize: $pageSize
        currentPage: $currentPage
        sort: $sort
        filter: $filter
      ) {
        items {
          __typename
          name
          sku
          url_key
          small_image {
            url
          }
          media_gallery {
            url
          }
          price_range {
            minimum_price {
              final_price {
                value
                currency
              }
              regular_price {
                value
                currency
              }
            }
          }
          stock_status
          short_description {
            html
          }
          ... on ConfigurableProduct {
            configurable_options {
              attribute_code
              label
              values {
                value_index
                label
              }
            }
            variants {
              product {
                name
                sku
                url_key
                small_image {
                  url
                }
                media_gallery {
                  url
                }
                price_range {
                  minimum_price {
                    final_price {
                      value
                      currency
                    }
                    regular_price {
                      value
                      currency
                    }
                  }
                }
              }
              attributes {
                code
                value_index
              }
            }
          }
        }
        total_count
        aggregations {
          attribute_code
          label
          options {
            label
            value
            count
          }
        }
      }
    }
  `;

  const sort = {
    price: params.sort === "price_asc" ? "ASC" : "DESC"
  };

  const filter: Record<string, unknown> = {};

  if (params.color) {
    filter[COLOR_ATTRIBUTE] = { in: [params.color] };
  }

  const priceFrom =
    typeof params.priceRange?.from === "number" &&
    Number.isFinite(params.priceRange.from)
      ? params.priceRange.from
      : undefined;
  const priceTo =
    typeof params.priceRange?.to === "number" &&
    Number.isFinite(params.priceRange.to)
      ? params.priceRange.to
      : undefined;

  if (priceFrom !== undefined || priceTo !== undefined) {
    filter.price = {
      from: priceFrom?.toString(),
      to: priceTo?.toString()
    };
  }

  if (params.searchKeyword) {
    filter.name = { match: params.searchKeyword };
  }

  if (params.rooms && params.rooms.length) {
    filter[ROOM_ATTRIBUTE] = { in: params.rooms };
  }

  if (params.materials && params.materials.length) {
    filter[MATERIAL_ATTRIBUTE] = { in: params.materials };
  }

  if (params.sizes && params.sizes.length) {
    filter[SIZE_ATTRIBUTE] = { in: params.sizes };
  }

  if (params.categoryUids && params.categoryUids.length) {
    filter.category_uid = { in: params.categoryUids };
  }

  const response = await graphqlFetch<ProductsQueryResponse>({
    endpoint: MAGENTO_ENDPOINT,
    query,
    variables: {
      pageSize: params.pageSize,
      currentPage: params.page,
      sort,
      filter
    },
    headers: {
      Store: MAGENTO_STORE_HEADER
    }
  });

  const items: ProductSummary[] = response.products.items
    .map((item) => mapProductToSummary(item))
    .filter(Boolean) as ProductSummary[];

  const groupedItems = groupProductsByName(items);

  // Sort grouped items by price
  groupedItems.sort((a, b) => {
    const aPrice = a.price?.value || 0;
    const bPrice = b.price?.value || 0;
    return params.sort === "price_asc" ? aPrice - bPrice : bPrice - aPrice;
  });

  const saleItems = groupedItems.filter((product) =>
    product.badges?.some((b) => b.toLowerCase() === "sale")
  );

  const colorAgg =
    findAggregation(response.products.aggregations, [
      COLOR_ATTRIBUTE,
      "color",
      "farbe"
    ])?.options ?? [];

  const colorOptions = colorAgg ? mapAggregationOptions(colorAgg) : [];

  const materialAgg =
    findAggregation(response.products.aggregations, [
      MATERIAL_ATTRIBUTE,
      "material",
      "material_filter",
      "materialgruppe"
    ])?.options ?? [];

  const materialOptions = materialAgg ? mapAggregationOptions(materialAgg) : [];

  const sizeAgg =
    findAggregation(response.products.aggregations, [
      SIZE_ATTRIBUTE,
      "size",
      "size_filter",
      "groesse",
      "shape"
    ])?.options ?? [];

  const sizeOptions = sizeAgg ? mapAggregationOptions(sizeAgg) : [];

  const roomAgg =
    findAggregation(response.products.aggregations, [
      ROOM_ATTRIBUTE,
      "room",
      "room_filter",
      "living_area"
    ])?.options ?? [];

  const roomOptions = roomAgg ? mapAggregationOptions(roomAgg) : [];

  return {
    items: groupedItems,
    saleItems,
    totalCount: response.products.total_count ?? 0,
    colorOptions,
    roomOptions,
    materialOptions,
    sizeOptions
  };
}

export async function fetchMagentoFacets(categoryUids?: string[]): Promise<{
  colorOptions: Array<{ label: string; value: string; count?: number }>;
  roomOptions: Array<{ label: string; value: string; count?: number }>;
  materialOptions: Array<{ label: string; value: string; count?: number }>;
  sizeOptions: Array<{ label: string; value: string; count?: number }>;
}> {
  const query = /* GraphQL */ `
    query Facets(
      $pageSize: Int
      $currentPage: Int
      $search: String
      $filter: ProductAttributeFilterInput
    ) {
      products(
        pageSize: $pageSize
        currentPage: $currentPage
        search: $search
        filter: $filter
      ) {
        aggregations {
          attribute_code
          label
          options {
            label
            value
            count
          }
        }
      }
    }
  `;

  const response = await graphqlFetch<ProductsQueryResponse>({
    endpoint: MAGENTO_ENDPOINT,
    query,
    variables: {
      pageSize: 1,
      currentPage: 1,
      search: " ",
      filter: categoryUids?.length
        ? {
            category_uid: {
              in: categoryUids
            }
          }
        : undefined
    },
    headers: {
      Store: MAGENTO_STORE_HEADER
    }
  });

  const colorAgg =
    findAggregation(response.products.aggregations, [
      COLOR_ATTRIBUTE,
      "color",
      "farbe"
    ])?.options ?? [];
  const roomAgg =
    findAggregation(response.products.aggregations, [
      ROOM_ATTRIBUTE,
      "room",
      "room_filter",
      "living_area"
    ])?.options ?? [];
  const materialAgg =
    findAggregation(response.products.aggregations, [
      MATERIAL_ATTRIBUTE,
      "material",
      "material_filter",
      "materialgruppe"
    ])?.options ?? [];
  const sizeAgg =
    findAggregation(response.products.aggregations, [
      SIZE_ATTRIBUTE,
      "size",
      "size_filter",
      "groesse",
      "shape"
    ])?.options ?? [];

  const mapOptions = (opts: typeof colorAgg) =>
    mapAggregationOptions(opts ?? []);

  return {
    colorOptions: mapOptions(colorAgg),
    roomOptions: mapOptions(roomAgg),
    materialOptions: mapOptions(materialAgg),
    sizeOptions: mapOptions(sizeAgg)
  };
}

export type MagentoCategory = {
  uid: string;
  name?: string | null;
  children?: MagentoCategory[] | null;
};

export async function fetchMagentoCategories(): Promise<
  Array<{ label: string; value: string }>
> {
  const query = /* GraphQL */ `
    query CategoryTree {
      categoryList(filters: { ids: { eq: "2" } }) {
        children {
          uid
          name
          children {
            uid
            name
          }
        }
      }
    }
  `;

  type CategoryResponse = {
    categoryList: Array<{ children?: MagentoCategory[] | null }> | null;
  };

  const response = await graphqlFetch<CategoryResponse>({
    endpoint: MAGENTO_ENDPOINT,
    query,
    headers: { Store: MAGENTO_STORE_HEADER }
  });

  const flatten = (categories?: MagentoCategory[] | null) => {
    const result: Array<{ label: string; value: string }> = [];
    (categories ?? []).forEach((category) => {
      if (!category?.uid || !category.name) return;
      result.push({ label: category.name, value: category.uid });
      if (category.children?.length) {
        category.children.forEach((child) => {
          if (!child?.uid || !child.name) return;
          result.push({
            label: `${category.name} / ${child.name}`,
            value: child.uid
          });
        });
      }
    });
    return result;
  };

  const root = response.categoryList?.[0];
  return flatten(root?.children) ?? [];
}

export async function fetchMagentoProductDetail(
  identifier: string
): Promise<ProductDetail | null> {
  const resolvedKey = await resolveUrlKey(identifier);
  const urlKeyToUse = resolvedKey ?? identifier;

  const query = /* GraphQL */ `
    query ProductDetail($urlKey: String) {
      products(filter: { url_key: { eq: $urlKey } }) {
        items {
          __typename
          name
          sku
          url_key
          url_suffix
          small_image {
            url
          }
          media_gallery {
            url
          }
          price_range {
            minimum_price {
              final_price {
                value
                currency
              }
              regular_price {
                value
                currency
              }
            }
          }
          short_description {
            html
          }
          description {
            html
          }
          stock_status
          related_products {
            __typename
            name
            sku
            url_key
            small_image {
              url
            }
            media_gallery {
              url
            }
            price_range {
              minimum_price {
                final_price {
                  value
                  currency
                }
                regular_price {
                  value
                  currency
                }
              }
            }
            short_description {
              html
            }
            stock_status
            ... on ConfigurableProduct {
              configurable_options {
                attribute_code
                label
                values {
                  value_index
                  label
                }
              }
              variants {
                product {
                  name
                  sku
                  url_key
                  small_image {
                    url
                  }
                  media_gallery {
                    url
                  }
                  price_range {
                    minimum_price {
                      final_price {
                        value
                        currency
                      }
                      regular_price {
                        value
                        currency
                      }
                    }
                  }
                }
                attributes {
                  code
                  value_index
                }
              }
            }
          }
          ... on ConfigurableProduct {
            configurable_options {
              attribute_code
              label
              values {
                value_index
                label
              }
            }
            variants {
              product {
                name
                sku
                url_key
                small_image {
                  url
                }
                media_gallery {
                  url
                }
                price_range {
                  minimum_price {
                    final_price {
                      value
                      currency
                    }
                    regular_price {
                      value
                      currency
                    }
                  }
                }
              }
              attributes {
                code
                value_index
              }
            }
          }
        }
      }
    }
  `;

  const response = await graphqlFetch<ProductsQueryResponse>({
    endpoint: MAGENTO_ENDPOINT,
    query,
    variables: { urlKey: urlKeyToUse },
    headers: { Store: MAGENTO_STORE_HEADER }
  });

  type ProductWithRelated = MagentoProduct & {
    related_products?: MagentoProduct[] | null;
  };

  let product = response.products.items?.[0] as ProductWithRelated | undefined;
  const initialSummary = product ? mapProductToSummary(product) : null;

  if (!isConfigurableWithVariants(product)) {
    const baseKey = stripColorFromSlug(urlKeyToUse);
    const searchTerms = [
      urlKeyToUse,
      baseKey,
      buildSearchHint(urlKeyToUse),
      buildSearchHint(baseKey ?? ""),
      product?.sku,
      initialSummary?.name,
      buildSearchHint(initialSummary?.name ?? "")
    ].filter(Boolean) as string[];

    for (const term of searchTerms) {
      if (!term) continue;
      // direct url_key retry
      const retry = await graphqlFetch<ProductsQueryResponse>({
        endpoint: MAGENTO_ENDPOINT,
        query,
        variables: { urlKey: term },
        headers: { Store: MAGENTO_STORE_HEADER }
      }).catch(() => null);
      const candidate = retry?.products.items?.find(isConfigurableWithVariants);
      if (candidate) {
        product = candidate as ProductWithRelated;
        break;
      }
      const configurable = await searchConfigurableProduct(term);
      if (configurable) {
        product = configurable as ProductWithRelated;
        break;
      }
    }
  }

  if (
    isConfigurableWithVariants(product) &&
    (product?.variants?.length ?? 0) <= 1
  ) {
    const variantHints = [
      product?.name ?? null,
      initialSummary?.name ?? null,
      buildSearchHint(product?.name ?? ""),
      buildSearchHint(initialSummary?.name ?? "")
    ].filter(Boolean) as string[];

    for (const hint of variantHints) {
      if (!hint) continue;
      const enriched = await searchConfigurableProduct(hint);
      if (enriched?.variants?.length) {
        product = enriched as ProductWithRelated;
        break;
      }
    }
  }

  if (!product?.name) return null;

  const baseSummary = mapProductToSummary(product);
  if (!baseSummary) return null;

  const gallery = cleanGallery(product.media_gallery);
  const variantChoices =
    product.__typename === "ConfigurableProduct"
      ? mapVariantsWithSizes(product)
      : baseSummary.variants ?? null;
  const relatedProducts = (product.related_products ?? [])
    .map((item) => mapProductToSummary(item))
    .filter(Boolean) as ProductSummary[];

  return {
    ...baseSummary,
    descriptionHtml:
      product.description?.html ?? product.short_description?.html ?? null,
    gallery,
    relatedProducts,
    variantChoices: variantChoices ?? undefined
  };
}

async function resolveUrlKey(identifier: string): Promise<string | null> {
  const resolverQuery = /* GraphQL */ `
    query ResolveUrl($url: String!) {
      urlResolver(url: $url) {
        canonical_url
        relative_url
        type
      }
    }
  `;

  try {
    const res = await graphqlFetch<UrlResolverResponse>({
      endpoint: MAGENTO_ENDPOINT,
      query: resolverQuery,
      variables: { url: identifier },
      headers: { Store: MAGENTO_STORE_HEADER }
    });
    const url =
      res.urlResolver?.canonical_url ?? res.urlResolver?.relative_url ?? null;
    if (!url) return null;
    return extractUrlKey(url);
  } catch {
    return null;
  }
}

function extractUrlKey(url: string): string | null {
  const clean = url.split("?")[0].replace(/^\/+/, "");
  const parts = clean.split("/");
  const last = parts[parts.length - 1] ?? "";
  const withoutSuffix = last.replace(/\.html?$/i, "");
  return withoutSuffix || null;
}

function stripColorFromSlug(slug: string): string | null {
  const parts = slug.split("-");
  if (parts.length < 4) return null;
  const last = parts[parts.length - 1];
  const secondLast = parts[parts.length - 2];
  const numeric = (val: string) => /^\d+$/.test(val);
  if (numeric(last) && numeric(secondLast)) {
    // assume thirdLast is color token
    const trimmed = [...parts.slice(0, parts.length - 3), secondLast, last];
    return trimmed.join("-");
  }
  return null;
}

async function searchConfigurableProduct(
  searchKey: string
): Promise<MagentoProduct | null> {
  const searchQuery = /* GraphQL */ `
    query SearchConfigurable($search: String) {
      products(search: $search, pageSize: 30) {
        items {
          __typename
          name
          sku
          url_key
          small_image {
            url
          }
          media_gallery {
            url
          }
          price_range {
            minimum_price {
              final_price {
                value
                currency
              }
              regular_price {
                value
                currency
              }
            }
          }
          short_description {
            html
          }
          ... on ConfigurableProduct {
            configurable_options {
              attribute_code
              label
              values {
                value_index
                label
              }
            }
            variants {
              product {
                name
                sku
                url_key
                small_image {
                  url
                }
                media_gallery {
                  url
                }
                price_range {
                  minimum_price {
                    final_price {
                      value
                      currency
                    }
                    regular_price {
                      value
                      currency
                    }
                  }
                }
              }
              attributes {
                code
                value_index
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await graphqlFetch<ProductsQueryResponse>({
      endpoint: MAGENTO_ENDPOINT,
      query: searchQuery,
      variables: { search: searchKey },
      headers: { Store: MAGENTO_STORE_HEADER }
    });
    const match = res.products.items.find(
      (item) =>
        item.__typename === "ConfigurableProduct" && item.variants?.length
    );
    return match ?? null;
  } catch {
    return null;
  }
}

function buildSearchHint(input: string): string | null {
  if (!input) return null;
  const clean = input.replace(/\.html?$/i, "");
  const parts = clean.split(/[-\s]+/);
  const filtered = parts.filter((p) => p && !/^\d+$/.test(p));
  if (!filtered.length) return null;
  // take first 3 words
  const firstThree = filtered.slice(0, 3);
  return firstThree.join(" ");
}
