"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "../navbar";
import { ProductDetailGallery } from "./gallery";
import { ProductDetailInfo } from "./info";
import type { ProductDetail } from "../../lib/magento";
import type { ProductSummary } from "../product-card";
import {
  cacheProductSnapshot,
  loadProductSnapshot
} from "../../utils/product-cache";
import { ProductSlider } from "../product-slider";
import { Footer } from "../footer";

type VariantCandidate = NonNullable<ProductDetail["variantChoices"]>[number];

interface ProductDetailClientProps {
  product: ProductDetail;
  slug?: string;
}

const defaultProductFieldConfig = [
  { label: "Artikelnummer", field: "sku" },
  { label: "Produktname", field: "name" },
  { label: "Verfügbarkeit", field: "availability" }
] as const;

export function ProductDetailClient({
  product,
  slug
}: ProductDetailClientProps) {
  const snapshot = useMemo<ProductSummary | null>(
    () => loadProductSnapshot(slug ?? product.urlKey ?? product.sku ?? null),
    [slug, product.urlKey, product.sku]
  );

  const mergedProduct = useMemo(() => {
    const snapshotVariants = snapshot?.variants ?? [];
    const snapshotChoices =
      (snapshot as ProductDetail | null)?.variantChoices ?? snapshotVariants;

    const mergedVariants =
      snapshotVariants.length &&
      (!product.variants || product.variants.length < snapshotVariants.length)
        ? mergeVariants(product.variants ?? [], snapshotVariants)
        : product.variants;

    const mergedChoices =
      snapshotChoices.length > 0 ? snapshotChoices : product.variantChoices;

    return {
      ...product,
      variants: mergedVariants ?? product.variants,
      variantChoices: mergedChoices ?? product.variantChoices
    };
  }, [product, snapshot]);

  const router = useRouter();
  const [productDetails, setProductDetails] = useState<{
    title?: string | null;
    productFields?: { label: string; field: string }[] | null;
    entries?: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    fetch("/product-details.json")
      .then((res) => res.json())
      .then((data) => setProductDetails(data?.default ?? null))
      .catch(() => setProductDetails(null));
  }, []);

  const selectedVariant = useMemo(
    () => selectInitialVariant(mergedProduct, slug),
    [mergedProduct, slug]
  );

  const navigateToVariant = (variant: VariantCandidate | null) => {
    if (!variant) return;
    const slugToUse = variant.urlKey ?? variant.sku;
    if (!slugToUse) return;
    cacheProductSnapshot(slugToUse, mergedProduct);
    const target = `/p/${encodeURIComponent(slugToUse)}`;
    router.replace(target);
  };
  const images = useMemo(() => {
    const allImages = new Set<string>();
    if (selectedVariant) {
      if (selectedVariant.imageUrl) allImages.add(selectedVariant.imageUrl);
      if (selectedVariant.hoverImageUrl)
        allImages.add(selectedVariant.hoverImageUrl);
    }
    mergedProduct.gallery.forEach((img) => allImages.add(img));
    if (mergedProduct.imageUrl && !allImages.has(mergedProduct.imageUrl)) {
      allImages.add(mergedProduct.imageUrl);
    }
    return Array.from(allImages);
  }, [selectedVariant, mergedProduct.gallery, mergedProduct.imageUrl]);

  const pageContainerClasses = "w-full page-padding-x";
  const productFieldConfig =
    productDetails?.productFields ?? defaultProductFieldConfig;
  const resolvedProductFieldRows = productFieldConfig
    .map((cfg) => {
      const value = resolveProductFieldValue(
        cfg.field,
        product,
        selectedVariant
      );
      if (!value) return null;
      return { label: cfg.label, value };
    })
    .filter(Boolean) as { label: string; value: string }[];

  const similarKeyword = useMemo(() => {
    const firstWord = product.name?.split(" ")[0];
    return firstWord && firstWord.length >= 3 ? firstWord : undefined;
  }, [product.name]);

  return (
    <main className="bg-[#f2f2ef] pt-20 flex min-h-screen flex-col">
      <NavBar />
      <div className="w-full flex-1">
        <div
          className={`${pageContainerClasses} flex flex-col gap-8 py-8 lg:flex-row lg:items-start`}
        >
          <div className="w-full lg:w-3/5">
            <ProductDetailGallery images={images} />
          </div>
          <div className="w-full lg:w-2/5">
            <ProductDetailInfo
              product={mergedProduct}
              selectedVariant={selectedVariant}
              onVariantChange={navigateToVariant}
            />
          </div>
        </div>
        <div className="border-t border-slate-200 bg-[#f2f2ef]">
          <div className={`${pageContainerClasses} flex flex-col gap-6 py-10`}>
            <h2 className="text-2xl font-semibold text-slate-900">
              {productDetails?.title ?? "Produktdetails"}
            </h2>
            <table className="w-full table-auto border-collapse">
              <tbody>
                {resolvedProductFieldRows.map((row) => (
                  <tr key={row.label}>
                    <td className="py-1 pr-4 font-medium text-slate-900 align-top">
                      {row.label}:
                    </td>
                    <td className="py-1 text-slate-700 align-top">
                      {row.value}
                    </td>
                  </tr>
                ))}
                {productDetails?.entries &&
                  Object.entries(productDetails.entries).map(([key, value]) => (
                    <tr key={key}>
                      <td className="py-1 pr-4 font-medium text-slate-900 align-top">
                        {key}:
                      </td>
                      <td className="py-1 text-slate-700 whitespace-pre-line align-top">
                        {value}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        <section className="border-t border-slate-200 bg-[#f2f2ef]">
          <ProductSlider
            title="Ähnliche Produkte"
            filter={similarKeyword ? { keyword: similarKeyword } : undefined}
            sort="price_asc"
            minimumItems={8}
          />
        </section>
      </div>
      <Footer />
    </main>
  );
}

function selectInitialVariant(product: ProductDetail, slug?: string | null) {
  const variantSource = product.variantChoices ?? product.variants ?? undefined;
  if (!variantSource || variantSource.length === 0) return null;
  if (slug) {
    const decoded = slug.toLowerCase();
    const direct = variantSource.find(
      (v) =>
        (v.urlKey && v.urlKey.toLowerCase() === decoded) ||
        (v.sku && v.sku.toLowerCase() === decoded)
    );
    if (direct) return direct;
    const partial = variantSource.find(
      (v) =>
        (v.urlKey && decoded.includes(v.urlKey.toLowerCase())) ||
        (v.sku && decoded.includes(v.sku.toLowerCase()))
    );
    if (partial) return partial;
  }
  const matchParent = variantSource.find(
    (v) => v.urlKey && v.urlKey === product.urlKey
  );
  return matchParent ?? variantSource[0];
}

function resolveProductFieldValue(
  field: string,
  product: ProductDetail,
  selectedVariant: VariantCandidate | null
) {
  switch (field) {
    case "sku":
      return product.sku || "Nicht verfügbar";
    case "name":
      return product.name || "Nicht verfügbar";
    case "availability":
      return product.inStock !== false ? "Auf Lager" : "Nicht auf Lager";
    case "selectedVariant":
      return (
        selectedVariant?.name ||
        selectedVariant?.colorLabel ||
        selectedVariant?.sku ||
        ""
      );
    default:
      return "";
  }
}

function mergeVariants(
  primary: VariantCandidate[],
  fallback: VariantCandidate[]
) {
  const map = new Map<string, VariantCandidate>();
  [...primary, ...fallback].forEach((variant) => {
    const key =
      variant.urlKey ??
      variant.sku ??
      (variant.colorLabel ? `color-${variant.colorLabel}` : variant.name ?? "");
    if (!map.has(key)) {
      map.set(key, variant);
    }
  });
  return Array.from(map.values()) as NonNullable<ProductDetail["variants"]>;
}
