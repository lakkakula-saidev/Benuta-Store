# Magento data flow map

This document visualizes how data flows and where Magento GraphQL requests occur across sliders, catalog, and product detail components.

Primary Magento request points:
- [TypeScript.graphqlFetch()](src/lib/graphql-client.ts:20)
- [TypeScript.POST()](src/app/api/magento/route.ts:13)
- [TypeScript.fetchMagentoProducts()](src/lib/magento.ts:30)
- [TypeScript.fetchMagentoFacets()](src/lib/magento.ts:268)
- [TypeScript.fetchMagentoProductDetail()](src/lib/magento.ts:416)
- [TypeScript.resolveUrlKey()](src/lib/magento.ts:660)
- [TypeScript.searchConfigurableProduct()](src/lib/magento.ts:709)

Helpers shaping Magento data:
- [TypeScript.mapProductToSummary()](src/lib/magento/helpers.ts:224)
- [TypeScript.groupProductsByName()](src/lib/magento/helpers.ts:37)
- [TypeScript.mapAggregationOptions()](src/lib/magento/helpers.ts:198)
- [TypeScript.mapVariants()](src/lib/magento/helpers.ts:269)
- [TypeScript.mapVariantsWithSizes()](src/lib/magento/helpers.ts:351)
- [TypeScript.cleanGallery()](src/lib/magento/helpers.ts:14)

Client hooks and pages:
- [TypeScript.useProductSlider()](src/hooks/useProductSlider.ts:8)
- [TypeScript.useProducts()](src/lib/api/magento.ts:12)
- [TypeScript.useFacets()](src/lib/api/magento.ts:33)
- [TypeScript.useProductDetail()](src/lib/api/magento.ts:44)
- [TypeScript.HomePage](src/app/page.tsx)
- [TypeScript.CatalogPage](src/components/catalog-page.tsx)
- [TypeScript.ProductDetailClient](src/components/product-detail/product-detail-client.tsx)

Configuration:
- [TypeScript.MAGENTO_ENDPOINT](src/lib/magento/constants.ts:1)
- [TypeScript.MAGENTO_STORE_HEADER](src/lib/magento/constants.ts:3)

System sequence: client to Magento via proxy

```mermaid
sequenceDiagram
autonumber
participant Client
participant UI
participant graphqlFetch
participant API_Magento_Proxy
participant Magento_GraphQL
participant Helpers
Client->>UI: open page
UI->>graphqlFetch: prepare GraphQL request
Note over graphqlFetch: if window defined and endpoint equals MAGENTO_ENDPOINT then POST to proxy
graphqlFetch->>API_Magento_Proxy: POST query variables headers
API_Magento_Proxy->>Magento_GraphQL: POST upstream
Magento_GraphQL-->>API_Magento_Proxy: JSON response
API_Magento_Proxy-->>graphqlFetch: JSON pass-through
graphqlFetch-->>Helpers: data for mapping
Helpers-->>UI: ProductSummary lists
```

ProductSlider data flow

```mermaid
graph TD
HomePage --> ProductSlider
ProductSlider --> useProductSlider
useProductSlider --> fetchMagentoProducts
fetchMagentoProducts --> graphqlFetch
graphqlFetch --> API_Magento_Proxy
API_Magento_Proxy --> Magento_GraphQL
Magento_GraphQL --> graphqlFetch
graphqlFetch --> fetchMagentoProducts
fetchMagentoProducts --> helpers_map
helpers_map[helpers mapProductToSummary; groupProductsByName; mapAggregationOptions]
helpers_map --> useProductSlider
useProductSlider --> ProductSlider
ProductSlider --> ProductCard
```

CatalogPage infinite products and facets flow

```mermaid
graph TD
CatalogPage --> useProducts
CatalogPage --> useFacets
useProducts --> fetchMagentoProducts
useFacets --> fetchMagentoFacets
fetchMagentoProducts --> graphqlFetch
fetchMagentoFacets --> graphqlFetch
graphqlFetch --> API_Magento_Proxy
API_Magento_Proxy --> Magento_GraphQL
Magento_GraphQL --> graphqlFetch
graphqlFetch --> useProducts
graphqlFetch --> useFacets
useProducts --> ProductCard
```

Pagination math and caching

Loaded items: $loaded = nPages \\times pageSize$
Next page condition: $loaded < totalCount$
Caching: react query stale time products $60\\,000\\,\\text{ms}$ facets $600\\,000\\,\\text{ms}$ product detail $300\\,000\\,\\text{ms}$

ProductDetail resolution and enrichment flow

```mermaid
graph TD
ProductPage_Server --> fetchMagentoProductDetail
fetchMagentoProductDetail --> resolveUrlKey
resolveUrlKey --> graphqlFetch
graphqlFetch --> fetchMagentoProductDetail
fetchMagentoProductDetail --> products_query
products_query[primary products query]
products_query --> check_configurable
check_configurable --> search_fallback
search_fallback[searchConfigurableProduct]
search_fallback --> graphqlFetch
graphqlFetch --> fetchMagentoProductDetail
fetchMagentoProductDetail --> helpers_detail
helpers_detail[cleanGallery; mapVariantsWithSizes; mapProductToSummary]
helpers_detail --> ProductDetailClient
ProductDetailClient --> ProductDetailGallery
ProductDetailClient --> ProductDetailInfo
ProductDetailClient --> ProductSlider
```

HomePage component interaction graph

```mermaid
graph TD
HomePage --> NavBar
HomePage --> HeroBanner
HomePage --> ProductSlider_popular
ProductSlider_popular[ProductSlider popular]
HomePage --> ProductSlider_sale
ProductSlider_sale[ProductSlider sale]
HomePage --> CustomProductSlider
ProductSlider_popular --> useProductSlider
ProductSlider_sale --> useProductSlider
useProductSlider --> fetchMagentoProducts
CustomProductSlider --> local_data
local_data[no Magento calls]
```

FiltersPanel behavior

- [TypeScript.FiltersPanel](src/components/filters-panel.tsx) does not call Magento; it updates state: selectedColor, priceRange, selectedRooms, selectedMaterials, selectedSizes.
- These states feed into [TypeScript.useProducts()](src/lib/api/magento.ts:12) and [TypeScript.useProductSlider()](src/hooks/useProductSlider.ts:8), which call [TypeScript.fetchMagentoProducts()](src/lib/magento.ts:30).

React Query configuration notes

- Products: infinite query with initial page 1; next page param uses $loaded = nPages \\times pageSize$ and compares to Magento $totalCount$.
- Facets: normal query with stale time $600\\,000\\,\\text{ms}$.
- Product detail: normal query with stale time $300\\,000\\,\\text{ms}$.
- Shared fetch proxy: [TypeScript.graphqlFetch()](src/lib/graphql-client.ts:20) proxies to [/api/magento](src/app/api/magento/route.ts) on client.

Code reference index

- [TypeScript.graphqlFetch()](src/lib/graphql-client.ts:20)
- [TypeScript.POST()](src/app/api/magento/route.ts:13)
- [TypeScript.fetchMagentoProducts()](src/lib/magento.ts:30)
- [TypeScript.fetchMagentoFacets()](src/lib/magento.ts:268)
- [TypeScript.fetchMagentoProductDetail()](src/lib/magento.ts:416)
- [TypeScript.resolveUrlKey()](src/lib/magento.ts:660)
- [TypeScript.searchConfigurableProduct()](src/lib/magento.ts:709)
- [TypeScript.mapProductToSummary()](src/lib/magento/helpers.ts:224)
- [TypeScript.groupProductsByName()](src/lib/magento/helpers.ts:37)
- [TypeScript.mapAggregationOptions()](src/lib/magento/helpers.ts:198)
- [TypeScript.mapVariants()](src/lib/magento/helpers.ts:269)
- [TypeScript.mapVariantsWithSizes()](src/lib/magento/helpers.ts:351)
- [TypeScript.cleanGallery()](src/lib/magento/helpers.ts:14)
- [TypeScript.useProductSlider()](src/hooks/useProductSlider.ts:8)
- [TypeScript.useProducts()](src/lib/api/magento.ts:12)
- [TypeScript.useFacets()](src/lib/api/magento.ts:33)
- [TypeScript.useProductDetail()](src/lib/api/magento.ts:44)
- [TypeScript.HomePage](src/app/page.tsx)
- [TypeScript.CatalogPage](src/components/catalog-page.tsx)
- [TypeScript.ProductDetailClient](src/components/product-detail/product-detail-client.tsx)
- [TypeScript.MAGENTO_ENDPOINT](src/lib/magento/constants.ts:1)
- [TypeScript.MAGENTO_STORE_HEADER](src/lib/magento/constants.ts:3)

Summary

All Magento requests are centralized in [TypeScript.graphqlFetch()](src/lib/graphql-client.ts:20), which proxies through [TypeScript.POST()](src/app/api/magento/route.ts:13) on the client, and are initiated by fetchers in [TypeScript.fetchMagentoProducts()](src/lib/magento.ts:30), [TypeScript.fetchMagentoFacets()](src/lib/magento.ts:268), and [TypeScript.fetchMagentoProductDetail()](src/lib/magento.ts:416). UI components consume mapped data via hooks and helpers.