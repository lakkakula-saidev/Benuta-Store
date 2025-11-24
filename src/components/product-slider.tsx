"use client";

import { useState } from "react";
import { ProductCard } from "./product-card";
import { useProductSlider } from "../hooks/useProductSlider";

const VISIBLE_COUNT = 5;

export interface ProductFilter {
  keyword?: string;
  color?: string;
  sale?: boolean;
  badge?: string;
}

interface ProductSliderProps {
  id?: string;
  title?: string;
  categoryUids?: string[];
  sort?: "price_asc" | "price_desc";
  filter?: ProductFilter;
  minimumItems?: number;
}

export function ProductSlider({
  id,
  title = "Entdecke unsere Produkte",
  categoryUids,
  sort = "price_asc",
  filter,
  minimumItems = 8
}: ProductSliderProps) {
  const { products, isLoading, isError } = useProductSlider({
    sort,
    categoryUids,
    filter,
    minimumItems
  });

  const [index, setIndex] = useState(0);
  const maxIndex = Math.max(0, products.length - VISIBLE_COUNT);

  const goPrev = () => setIndex((prev) => Math.max(prev - 1, 0));
  const goNext = () => setIndex((prev) => Math.min(prev + 1, maxIndex));

  return (
    <section id={id} className="bg-[#f2f2ef] section-padding">
      <div className="container-max flex flex-col gap-6">
        <SliderHeader
          title={title}
          onPrev={goPrev}
          onNext={goNext}
          index={index}
          maxIndex={maxIndex}
        />
        <SliderBody
          products={products}
          isLoading={isLoading}
          isError={isError}
          index={index}
        />
      </div>
    </section>
  );
}

function SliderHeader({
  title,
  onPrev,
  onNext,
  index,
  maxIndex
}: {
  title: string;
  onPrev: () => void;
  onNext: () => void;
  index: number;
  maxIndex: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      <div className="flex items-center gap-2">
        <SliderButton
          label="Vorherige Produkte"
          onClick={onPrev}
          disabled={index === 0}
        >
          ‹
        </SliderButton>
        <SliderButton
          label="Nächste Produkte"
          onClick={onNext}
          disabled={index === maxIndex}
        >
          ›
        </SliderButton>
      </div>
    </div>
  );
}

function SliderButton({
  children,
  label,
  onClick,
  disabled
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={label}
    >
      {children}
    </button>
  );
}

function SliderBody({
  products,
  isLoading,
  isError,
  index
}: {
  products: ReturnType<typeof useProductSlider>["products"];
  isLoading: boolean;
  isError: boolean;
  index: number;
}) {
  if (isLoading) {
    return (
      <div className="flex gap-4">
        {Array.from({ length: VISIBLE_COUNT }).map((_, idx) => (
          <div
            key={idx}
            className="h-80 w-full animate-pulse rounded-2xl bg-white shadow-sm"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Produkte konnten nicht geladen werden.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="flex transition-transform duration-500"
        style={{
          transform: `translateX(-${(index * 100) / VISIBLE_COUNT}%)`
        }}
      >
        {products.map((product) => (
          <div
            key={product.urlKey ?? product.sku}
            className="w-full px-2"
            style={{ flex: `0 0 ${100 / VISIBLE_COUNT}%` }}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
