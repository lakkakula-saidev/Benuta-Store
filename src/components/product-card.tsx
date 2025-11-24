import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cacheProductSnapshot } from "../utils/product-cache";
import { colorSwatchClass } from "../utils/color";
import { useShopLists, ProductListItemInput } from "../context/shop-lists";
import { IconHeart } from "./icons";

export type ProductSummary = {
  name: string;
  sku: string;
  urlKey: string | null;
  imageUrl: string | null;
  hoverImageUrl?: string | null;
  price: { value: number; currency: string } | null;
  originalPrice?: { value: number; currency: string } | null;
  badges?: string[];
  shortDescription?: string | null;
  inStock?: boolean | null;
  variants?: Array<{
    colorLabel?: string | null;
    colorValue?: number | null;
    imageUrl?: string | null;
    hoverImageUrl?: string | null;
    price?: { value: number; currency: string } | null;
    name?: string | null;
    sku?: string | null;
    urlKey?: string | null;
    originalPrice?: { value: number; currency: string } | null;
  }>;
};

export function ProductCard({ product }: { product: ProductSummary }) {
  const [activeVariantIndex, setActiveVariantIndex] = useState<number | null>(
    product.variants && product.variants.length > 0 ? 0 : null
  );
  const favoriteId = product.urlKey ?? product.sku;
  const { favorites, toggleFavorite } = useShopLists();
  const isFavorite = Boolean(
    favoriteId && favorites.some((item) => item.id === favoriteId)
  );

  const activeVariant =
    activeVariantIndex != null
      ? product.variants?.[activeVariantIndex] ?? null
      : null;

  const baseName = product.name ?? product.sku ?? "Produkt";
  const altText = activeVariant?.name ?? baseName;

  const priceLabel = formatPrice(activeVariant?.price ?? product.price) ?? "—";
  const originalPriceLabel = formatPrice(
    activeVariant?.originalPrice ?? product.originalPrice
  );
  const badges = product.badges ?? [];

  const variantDetail = formatVariantDetail(
    baseName,
    activeVariant?.name,
    activeVariant?.colorLabel
  );

  const imageUrl = activeVariant?.imageUrl || product.imageUrl;
  const hoverImageUrl = activeVariant?.hoverImageUrl || product.hoverImageUrl;
  const hasVariants = product.variants && product.variants.length > 0;
  const swatches = hasVariants
    ? product.variants!.map((variant, idx) => ({ variant, idx })).slice(0, 6)
    : [];
  const extraCount =
    hasVariants && product.variants!.length > 6
      ? product.variants!.length - 6
      : 0;

  const baseSlug = product.urlKey ?? product.sku;
  const activeSlug = activeVariant?.urlKey ?? activeVariant?.sku ?? baseSlug;

  const handleNavigate = () => {
    if (activeSlug) {
      cacheProductSnapshot(activeSlug, product);
    } else if (baseSlug) {
      cacheProductSnapshot(baseSlug, product);
    }
  };

  const favoritePayload: ProductListItemInput | null = favoriteId
    ? {
        id: favoriteId,
        sku: activeVariant?.sku ?? product.sku,
        urlKey: activeVariant?.urlKey ?? product.urlKey,
        name: activeVariant?.name ?? product.name,
        variant: activeVariant?.colorLabel ?? activeVariant?.name ?? null,
        imageUrl: activeVariant?.imageUrl ?? product.imageUrl,
        price: activeVariant?.price ?? product.price,
        quantity: 1
      }
    : null;

  return (
    <article className="group flex h-full flex-col rounded-[14px] border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <Link
        href={`/p/${activeSlug ?? baseSlug}`}
        className="group/image relative aspect-4/5 overflow-hidden rounded-[10px] bg-white"
        onClick={handleNavigate}
      >
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={altText}
              fill
              sizes="(max-width: 1024px) 50vw, 25vw"
              className="object-cover transition duration-500"
            />
            {hoverImageUrl ? (
              <Image
                src={hoverImageUrl}
                alt={`${altText} alternate view`}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover opacity-0 transition duration-500 group-hover/image:opacity-100"
              />
            ) : null}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            No image
          </div>
        )}
        {product.inStock === false ? (
          <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
            Sold out
          </span>
        ) : null}
      </Link>

      <div className="w-full pb-[15px] pt-2.5">
        <div className="flex flex-col items-start gap-2.5">
          <div className="flex w-full justify-between">
            <div className="min-h-28px">
              {hasVariants ? (
                <ul className="grid grid-cols-[repeat(4,minmax(0,36px))] justify-start gap-2">
                  {swatches.map(({ variant, idx }) => (
                    <li
                      key={`${
                        variant.sku ??
                        variant.urlKey ??
                        variant.colorValue ??
                        idx
                      }`}
                      className={`relative aspect-square max-h-36px max-w-36px overflow-hidden rounded-[5px] border transition-all ${
                        activeVariantIndex === idx
                          ? "border-slate-900"
                          : "border-transparent hover:border-slate-700"
                      }`}
                    >
                      <button
                        title={variant.colorLabel ?? "Color"}
                        className="relative block h-full w-full"
                        onClick={() => setActiveVariantIndex(idx)}
                      >
                        {variant.imageUrl ? (
                          <Image
                            src={variant.imageUrl}
                            alt={variant.colorLabel ?? "Variant image"}
                            fill
                            sizes="40px"
                            className="object-cover scale-125"
                          />
                        ) : (
                          <span
                            className={`block h-full w-full ${colorSwatchClass(
                              variant.colorLabel
                            )}`}
                          />
                        )}
                      </button>
                    </li>
                  ))}
                  {extraCount > 0 ? (
                    <li className="self-center text-[13px] font-light text-slate-800">
                      + {extraCount}
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </div>
            <div className="right-0 top-0 size-6 min-h-24px min-w-24px">
              <button
                type="button"
                title={
                  isFavorite
                    ? "Von den Favoriten entfernen"
                    : "Zu Favoriten hinzufügen"
                }
                className="flex h-6 w-6 items-center justify-center transition-opacity duration-200 hover:opacity-80"
                onClick={() => {
                  if (favoritePayload) toggleFavorite(favoritePayload);
                }}
                aria-pressed={isFavorite}
              >
                <IconHeart
                  className={`h-5 w-5 ${
                    isFavorite ? "text-slate-900" : "text-slate-800"
                  }`}
                  filled={isFavorite}
                />
              </button>
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-2.5">
            {badges.length ? (
              <div className="flex flex-wrap gap-2 text-[15px] font-medium leading-[18px] text-red-600">
                {badges.map((badge) => (
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
            <Link
              href={`/p/${activeSlug ?? baseSlug}`}
              className="w-full pr-1 text-left"
              onClick={handleNavigate}
            >
              <p className="text-[15px] font-extralight leading-[18px] text-slate-900">
                {baseName}
              </p>
              {variantDetail ? (
                <p className="text-[14px] font-light leading-[18px] text-slate-700">
                  {variantDetail}
                </p>
              ) : null}
            </Link>
            <div className="text-center font-extralight">
              <span className="mr-2.5 whitespace-nowrap bg-lime-200 px-1 text-[15px] font-extralight leading-[18px] text-slate-900">
                {priceLabel}
              </span>
              {originalPriceLabel && originalPriceLabel !== priceLabel ? (
                <span className="text-[15px] leading-[18px] line-through text-slate-500">
                  {originalPriceLabel}
                </span>
              ) : null}
            </div>
          </div>
          <div className="min-h-24px" />
        </div>
      </div>
    </article>
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

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatVariantDetail(
  baseName: string,
  variantName?: string | null,
  colorLabel?: string | null
): string | null {
  if (!variantName) return colorLabel ?? null;

  const base = baseName.trim();
  const escaped = escapeRegExp(base);
  const baseRegex = new RegExp("^" + escaped, "i");
  let rest = variantName.trim().replace(baseRegex, "").trim();
  rest = rest.replace(/^[,;:–-]+/, "").trim();

  if (!rest) return colorLabel ?? null;

  const sizeMatch = rest.match(/^(.*?)(\d+\s*x\s*\d+.*)$/i);
  if (sizeMatch) {
    const color = sizeMatch[1].trim();
    const size = sizeMatch[2].trim();
    if (color && size) return `${color} • ${size}`;
  }

  if (colorLabel && !rest.toLowerCase().includes(colorLabel.toLowerCase())) {
    return `${rest} • ${colorLabel}`;
  }

  return rest || colorLabel || null;
}
