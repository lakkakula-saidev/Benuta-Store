"use client";

import { useMemo } from "react";
import { ProductDetail } from "../../lib/magento";
import { colorSwatchClass } from "../../utils/color";
import { CustomSelect } from "../custom-select";
import {
  useShopLists,
  type ProductListItemInput
} from "../../context/shop-lists";

type VariantType =
  | NonNullable<ProductDetail["variantChoices"]>[number]
  | NonNullable<ProductDetail["variants"]>[number];

export function ProductDetailInfo({
  product,
  selectedVariant,
  onVariantChange
}: {
  product: ProductDetail;
  selectedVariant: VariantType | null;
  onVariantChange: (variant: VariantType | null) => void;
}) {
  const variantSource = useMemo(
    () =>
      (product.variantChoices ??
        product.variants ??
        ([] as VariantType[])) as VariantType[],
    [product.variantChoices, product.variants]
  );
  const selectedColor =
    selectedVariant?.colorLabel ?? variantSource[0]?.colorLabel ?? null;
  const activePrice = selectedVariant?.price ?? product.price;
  const activeOriginal =
    selectedVariant?.originalPrice ?? product.originalPrice;

  const formattedPrice = formatPrice(activePrice);
  const formattedOriginal = formatPrice(activeOriginal);
  const savings =
    activeOriginal && activePrice
      ? Math.max(0, activeOriginal.value - activePrice.value)
      : null;
  const isAvailable = selectedVariant ? true : product.inStock !== false;
  const availabilityLabel = isAvailable
    ? "Sofort lieferbar"
    : "Zur Zeit ausverkauft";

  const groupedByColor = useMemo(() => {
    const groups = new Map<string, VariantType[]>();
    variantSource.forEach((v) => {
      const key = v.colorLabel ?? "Default";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(v);
    });
    return groups;
  }, [variantSource]);

  const colorOptions = Array.from(groupedByColor.entries()).map(
    ([label, variants]) => ({
      label,
      preview:
        variants[0]?.imageUrl ??
        variants[0]?.hoverImageUrl ??
        product.imageUrl ??
        null
    })
  );
  const colorLabels = colorOptions
    .map((opt) => opt.label)
    .filter(Boolean) as string[];
  const sizeOptions = useMemo(() => {
    if (!selectedColor) return [];
    const variants = groupedByColor.get(selectedColor) ?? [];
    return variants.map((v) => ({
      key: v.urlKey ?? v.sku ?? v.name ?? v.colorLabel ?? "",
      label: deriveSizeLabel(product.name, v.name),
      variant: v
    }));
  }, [groupedByColor, selectedColor, product.name]);

  const currentSizeSelection =
    sizeOptions.find((opt) => opt.variant?.urlKey === selectedVariant?.urlKey)
      ?.key ?? sizeOptions[0]?.key;
  const { addToCart, addFavorite } = useShopLists();
  const actionProduct = useMemo<ProductListItemInput | null>(() => {
    const id =
      selectedVariant?.urlKey ??
      selectedVariant?.sku ??
      product.urlKey ??
      product.sku ??
      null;
    if (!id) return null;
    return {
      id,
      sku: selectedVariant?.sku ?? product.sku,
      urlKey: selectedVariant?.urlKey ?? product.urlKey,
      name: selectedVariant?.name ?? product.name,
      variant: selectedVariant?.colorLabel ?? selectedVariant?.name ?? null,
      imageUrl:
        selectedVariant?.imageUrl ??
        selectedVariant?.hoverImageUrl ??
        product.imageUrl ??
        product.gallery[0] ??
        null,
      price: selectedVariant?.price ?? product.price,
      quantity: 1
    };
  }, [product, selectedVariant]);

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-2">
        {product.badges?.length ? (
          <div className="flex flex-wrap gap-2 text-sm font-semibold">
            {product.badges.map((badge) => (
              <span
                key={badge}
                className={
                  badge.toLowerCase() === "sale"
                    ? "text-red-600"
                    : "text-orange-600"
                }
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}
        <h1 className="text-[32px] font-semibold leading-tight text-slate-900">
          {product.name}
        </h1>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold text-slate-900">
            {formattedPrice ?? "—"}
          </span>
          {formattedOriginal && formattedOriginal !== formattedPrice ? (
            <span className="text-base text-slate-500 line-through">
              {formattedOriginal}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isAvailable ? "bg-emerald-500" : "bg-red-500"
            }`}
            aria-hidden
          />
          <span>{availabilityLabel}</span>
        </div>
        {savings ? (
          <p className="text-sm text-slate-700">
            Du sparst{" "}
            {formatPrice({
              value: savings,
              currency: activePrice?.currency ?? "EUR"
            })}
          </p>
        ) : null}
      </div>

      {colorOptions.length ? (
        <div className="space-y-3" suppressHydrationWarning={true}>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800">
              Farbe:{" "}
              <span className="font-normal text-slate-900">
                {selectedColor ?? colorOptions[0]?.label}
              </span>
            </p>
            {colorLabels.length > 1 ? (
              <p className="text-xs text-slate-600">
                Verfügbare Farben: {colorLabels.join(", ")}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((color) => {
              const isActive = selectedColor === color.label;
              return (
                <button
                  key={color.label}
                  onClick={() => {
                    const next = groupedByColor.get(color.label)?.[0] ?? null;
                    onVariantChange(next ?? null);
                  }}
                  className={`flex items-center gap-2 rounded-md border px-2 py-2 transition cursor-pointer ${
                    isActive
                      ? "border-slate-900 bg-white shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                  aria-pressed={isActive}
                >
                  {color.preview ? (
                    <span className="h-8 w-8 overflow-hidden rounded-sm border border-slate-200 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={color.preview}
                        alt={color.label}
                        className="h-full w-full object-cover"
                      />
                    </span>
                  ) : (
                    <span
                      className={`h-8 w-8 rounded-sm border border-slate-200 ${colorSwatchClass(
                        color.label
                      )}`}
                    />
                  )}
                  <span className="text-sm text-slate-900">{color.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {sizeOptions.length ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-800">Größe</p>
          <CustomSelect
            options={sizeOptions.map((opt) => ({
              key: opt.key,
              label: opt.label
            }))}
            value={currentSizeSelection}
            onChange={(key) => {
              const opt = sizeOptions.find((o) => o.key === key);
              if (opt) onVariantChange(opt.variant);
            }}
          />
        </div>
      ) : null}

      {product.descriptionHtml ? (
        <div className="prose prose-sm max-w-none text-slate-700">
          <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
        </div>
      ) : null}

      <div className="flex gap-3">
        <button
          className="flex-1 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black cursor-pointer"
          onClick={() => {
            if (actionProduct) addToCart(actionProduct);
          }}
        >
          In den Warenkorb
        </button>
        <button
          className="rounded-full border border-slate-900 px-4 py-3 text-sm font-semibold text-slate-900 hover:border-slate-700 cursor-pointer"
          onClick={() => {
            if (actionProduct) addFavorite(actionProduct);
          }}
        >
          Zur Wunschliste
        </button>
      </div>
    </div>
  );
}

function formatPrice(
  price: { value: number; currency: string } | null | undefined
): string | null {
  if (!price || price.value == null || price.value <= 0) return null;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: price.currency
  }).format(price.value);
}

function deriveSizeLabel(baseName: string, variantName?: string | null) {
  if (!variantName) return "Variante";
  const normalizedBase = baseName.trim();
  let rest = variantName.trim();
  if (rest.toLowerCase().startsWith(normalizedBase.toLowerCase())) {
    rest = rest.slice(normalizedBase.length).trim();
  }
  rest = rest.replace(/^[-–:,]+/, "").trim();
  return rest || "Variante";
}
