import type { ProductSummary } from "../../components/product-card";
import type {
  MagentoMoney,
  MagentoProduct,
  ProductsQueryResponse
} from "../../types/magento";

function isPlaceholder(url: string | null | undefined) {
  if (!url) return true;
  const lower = url.toLowerCase();
  return lower.includes("placeholder") || lower.includes("no_selection");
}

export function cleanGallery(
  gallery?: Array<{ url?: string | null } | null> | null
): string[] {
  return (
    gallery
      ?.map((g) => g?.url ?? null)
      .filter((u): u is string => Boolean(u && !isPlaceholder(u))) ?? []
  );
}

export function pickPrimaryImage(
  smallUrl?: string | null,
  gallery: string[] = []
): string | null {
  const candidates = [smallUrl ?? null, ...gallery];
  const found = candidates.find((u) => u && !isPlaceholder(u));
  return found ?? null;
}

function normalizeName(name: string | null | undefined) {
  return (name ?? "").trim().toLowerCase();
}

export function groupProductsByName(items: ProductSummary[]): ProductSummary[] {
  const grouped = new Map<string, ProductSummary>();

  items.forEach((item) => {
    const key = normalizeName(item.name);
    if (!key) return;

    const fallbackVariant =
      !item.variants || item.variants.length === 0
        ? [
            {
              name: item.name,
              imageUrl: item.imageUrl ?? null,
              hoverImageUrl: item.hoverImageUrl ?? null,
              price: item.price,
              originalPrice: item.originalPrice ?? null,
              colorLabel: null,
              colorValue: null,
              sku: item.sku,
              urlKey: item.urlKey
            }
          ]
        : [];

    const incomingVariants = dedupeVariants([
      ...(item.variants ?? []),
      ...fallbackVariant
    ]);

    const incomingBadges = item.badges ?? [];

    if (!grouped.has(key)) {
      grouped.set(key, {
        ...item,
        variants: incomingVariants,
        badges: incomingBadges
      });
      return;
    }

    const existing = grouped.get(key)!;
    const mergedVariants = dedupeVariants([
      ...(existing.variants ?? []),
      ...incomingVariants
    ]);

    grouped.set(key, {
      ...existing,
      imageUrl: existing.imageUrl ?? item.imageUrl ?? null,
      hoverImageUrl: existing.hoverImageUrl ?? item.hoverImageUrl ?? null,
      price: existing.price ?? item.price ?? null,
      originalPrice: existing.originalPrice ?? item.originalPrice ?? null,
      variants: mergedVariants,
      badges: Array.from(
        new Set([...(existing.badges ?? []), ...incomingBadges])
      )
    });
  });

  return Array.from(grouped.values());
}

export function buildBadges(
  price: MagentoMoney | null | undefined,
  regularPrice: MagentoMoney | null | undefined
): string[] {
  const badges: string[] = [];
  if (price && regularPrice && price.value < regularPrice.value) {
    badges.push("Sale");
    const discountPercent =
      ((regularPrice.value - price.value) / regularPrice.value) * 100;
    if (discountPercent >= 20) {
      badges.push("Bestseller");
    }
  }
  return badges;
}

export function sanitizeMoney(
  money: MagentoMoney | null | undefined
): MagentoMoney | null {
  if (!money) return null;
  if (money.value == null || money.value <= 0) return null;
  return money;
}

function splitName(name: string): { baseName: string; detail?: string } {
  const trimmed = name.trim();
  const sizePattern = /(\d+\s*x\s*\d+(\s*(cm|mm|m))?)/i;
  const sizeMatch = trimmed.match(sizePattern);
  const withoutSize = trimmed.replace(sizePattern, "").trim();

  const colorWords = [
    "cream",
    "beige",
    "blue",
    "grau",
    "gray",
    "grey",
    "schwarz",
    "weiss",
    "weiß",
    "white",
    "black",
    "brown",
    "taupe",
    "rosa",
    "rose",
    "pink",
    "grün",
    "green",
    "red",
    "rot",
    "sand",
    "gold",
    "gelb",
    "ivory",
    "mint",
    "light",
    "dark"
  ];

  const parts = withoutSize.split(/\s+/);
  const colors: string[] = [];
  while (parts.length) {
    const last = parts[parts.length - 1].toLowerCase();
    if (colorWords.includes(last) || last.includes("/")) {
      colors.unshift(parts.pop() as string);
    } else {
      break;
    }
  }

  const baseName = parts.join(" ").trim() || trimmed;
  const detailPieces = [
    colors.join(" ") || null,
    sizeMatch?.[1] ?? null
  ].filter(Boolean) as string[];
  const detail = detailPieces.length ? detailPieces.join(" • ") : undefined;

  return { baseName, detail };
}

function extractColorFromName(name: string): string | null {
  const { detail } = splitName(name);
  if (!detail) return null;
  const colorPart = detail.split("•")[0]?.trim();
  return colorPart || null;
}

export function findAggregation(
  aggs: ProductsQueryResponse["products"]["aggregations"] | undefined,
  codes: string[]
) {
  if (!aggs) return undefined;
  return aggs.find((agg) =>
    agg?.attribute_code ? codes.includes(agg.attribute_code) : false
  );
}

export function mapAggregationOptions(
  options: NonNullable<
    ProductsQueryResponse["products"]["aggregations"]
  >[number]["options"]
) {
  const map = new Map<
    string,
    { label: string; value: string; count?: number }
  >();
  (options ?? []).forEach((opt) => {
    if (!opt?.label || !opt?.value) return;
    const key = String(opt.value);
    if (!map.has(key)) {
      map.set(key, {
        label: opt.label,
        value: String(opt.value),
        count: opt.count ?? undefined
      });
    } else {
      const prev = map.get(key)!;
      map.set(key, {
        ...prev,
        count: opt.count ?? prev.count
      });
    }
  });
  return Array.from(map.values());
}

export function mapProductToSummary(
  item: MagentoProduct
): ProductSummary | null {
  if (!item.name) return null;
  const { baseName } = splitName(item.name);

  const galleryImages = cleanGallery(item.media_gallery);
  const imageUrl = pickPrimaryImage(item.small_image?.url, galleryImages);
  const hoverImageUrl =
    galleryImages.find((url) => url && url !== imageUrl) ?? null;

  const variants =
    item.__typename === "ConfigurableProduct" && item.variants
      ? mapVariants(item)
      : undefined;

  const price =
    sanitizeMoney(item.price_range?.minimum_price?.final_price) ??
    sanitizeMoney(item.price_range?.minimum_price?.regular_price);
  const originalPrice = sanitizeMoney(
    item.price_range?.minimum_price?.regular_price
  );

  const result: ProductSummary = {
    name: baseName,
    sku: item.sku,
    urlKey: item.url_key,
    imageUrl,
    hoverImageUrl,
    price,
    originalPrice,
    shortDescription: item.short_description?.html ?? null,
    inStock: item.stock_status === "IN_STOCK",
    variants,
    badges: buildBadges(price, originalPrice)
  };

  const hasPricedVariant =
    result.variants?.some((v) => v.price && v.price.value > 0) ?? false;

  if (!result.price && !hasPricedVariant) return null;

  return result;
}

export function mapVariants(
  product: MagentoProduct
): ProductSummary["variants"] {
  const colorOption = product.configurable_options?.find((opt) =>
    opt.attribute_code
      ? ["color", "benuta_color_filter"].includes(opt.attribute_code)
      : false
  );

  const colorLabels = new Map<number, string>();
  colorOption?.values?.forEach((val) => {
    if (val?.value_index != null && val.label) {
      colorLabels.set(val.value_index, val.label);
    }
  });

  const parentGallery = cleanGallery(product.media_gallery);
  const parentPrimary = pickPrimaryImage(
    product.small_image?.url,
    parentGallery
  );
  const parentHover =
    parentGallery.find((url) => url && url !== parentPrimary) ?? null;

  const variantsMap = new Map<
    string,
    NonNullable<ProductSummary["variants"]>[number]
  >();

  product.variants?.forEach((variant) => {
    if (isSampleVariant(variant.product?.name)) return;
    const colorAttr = variant.attributes?.find((attr) =>
      attr.code ? ["color", "benuta_color_filter"].includes(attr.code) : false
    );
    const colorValue = colorAttr?.value_index ?? null;
    const colorFromName = extractColorFromName(variant.product?.name ?? "");
    const colorLabel =
      colorValue != null
        ? colorLabels.get(colorValue) ?? colorFromName
        : colorFromName;
    const galleryImages = cleanGallery(variant.product?.media_gallery);
    const imageUrl =
      pickPrimaryImage(variant.product?.small_image?.url, galleryImages) ??
      parentPrimary;
    const hoverImageUrl =
      galleryImages.find((url) => url && url !== imageUrl) ?? parentHover;

    const mapped = {
      name: variant.product?.name ?? null,
      sku: variant.product?.sku ?? null,
      urlKey: variant.product?.url_key ?? null,
      colorLabel,
      colorValue,
      imageUrl,
      hoverImageUrl,
      price:
        sanitizeMoney(
          variant.product?.price_range?.minimum_price?.final_price
        ) ??
        sanitizeMoney(
          variant.product?.price_range?.minimum_price?.regular_price
        ),
      originalPrice: sanitizeMoney(
        variant.product?.price_range?.minimum_price?.regular_price
      )
    };

    const key =
      colorValue != null
        ? `color-${colorValue}`
        : colorLabel
        ? `label-${colorLabel.toLowerCase()}`
        : "no-color";

    if (!variantsMap.has(key)) {
      variantsMap.set(key, mapped);
    }
  });

  return Array.from(variantsMap.values());
}

export function mapVariantsWithSizes(
  product: MagentoProduct
): ProductSummary["variants"] {
  const colorOption = product.configurable_options?.find((opt) =>
    opt.attribute_code
      ? ["color", "benuta_color_filter"].includes(opt.attribute_code)
      : false
  );

  const colorLabels = new Map<number, string>();
  colorOption?.values?.forEach((val) => {
    if (val?.value_index != null && val.label) {
      colorLabels.set(val.value_index, val.label);
    }
  });

  const parentGallery = cleanGallery(product.media_gallery);
  const parentPrimary = pickPrimaryImage(
    product.small_image?.url,
    parentGallery
  );
  const parentHover =
    parentGallery.find((url) => url && url !== parentPrimary) ?? null;

  const variantsMap = new Map<
    string,
    NonNullable<ProductSummary["variants"]>[number]
  >();

  product.variants?.forEach((variant) => {
    if (isSampleVariant(variant.product?.name)) return;
    const colorAttr = variant.attributes?.find((attr) =>
      attr.code ? ["color", "benuta_color_filter"].includes(attr.code) : false
    );
    const colorValue = colorAttr?.value_index ?? null;
    const colorFromName = extractColorFromName(variant.product?.name ?? "");
    const colorLabel =
      colorValue != null
        ? colorLabels.get(colorValue) ?? colorFromName
        : colorFromName;
    const galleryImages = cleanGallery(variant.product?.media_gallery);
    const imageUrl =
      pickPrimaryImage(variant.product?.small_image?.url, galleryImages) ??
      parentPrimary;
    const hoverImageUrl =
      galleryImages.find((url) => url && url !== imageUrl) ?? parentHover;

    const mapped = {
      name: variant.product?.name ?? null,
      sku: variant.product?.sku ?? null,
      urlKey: variant.product?.url_key ?? null,
      colorLabel,
      colorValue,
      imageUrl,
      hoverImageUrl,
      price:
        sanitizeMoney(
          variant.product?.price_range?.minimum_price?.final_price
        ) ??
        sanitizeMoney(
          variant.product?.price_range?.minimum_price?.regular_price
        ),
      originalPrice: sanitizeMoney(
        variant.product?.price_range?.minimum_price?.regular_price
      )
    };

    const key =
      variant.product?.sku ??
      variant.product?.url_key ??
      (colorValue != null
        ? `color-${colorValue}`
        : colorLabel
        ? `label-${colorLabel.toLowerCase()}`
        : "variant");
    if (!key) return;
    if (!variantsMap.has(key)) {
      variantsMap.set(key, mapped);
    }
  });

  return Array.from(variantsMap.values());
}

export function isConfigurableWithVariants(
  item?: MagentoProduct | null
): item is MagentoProduct & {
  variants: NonNullable<MagentoProduct["variants"]>;
} {
  return Boolean(
    item && item.__typename === "ConfigurableProduct" && item.variants?.length
  );
}

function isSampleVariant(name?: string | null): boolean {
  if (!name) return false;
  return /sample/i.test(name);
}

function dedupeVariants(
  variants: NonNullable<ProductSummary["variants"]>
): NonNullable<ProductSummary["variants"]> {
  const seen = new Set<string>();
  const result: typeof variants = [];
  variants.forEach((v) => {
    const key =
      v.sku ??
      v.urlKey ??
      (v.colorValue != null
        ? `color-${v.colorValue}`
        : v.colorLabel
        ? `label-${v.colorLabel.toLowerCase()}`
        : v.name ?? "");
    if (seen.has(key)) return;
    seen.add(key);
    result.push(v);
  });
  return result;
}
