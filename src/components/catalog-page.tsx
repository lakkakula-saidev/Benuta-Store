"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFacets, useProducts } from "../lib/api/magento";
import { ProductCard } from "./product-card";
import { FiltersPanel } from "./filters-panel";
import { SortSelect } from "./sort-select";
import { LoadMoreButton } from "./load-more-button";

const PAGE_SIZE = 20;

type FilterOption = { label: string; value: string; count?: number };

interface CatalogPageProps {
  title?: string;
  categoryUids?: string[];
}

export function CatalogPage({
  title = "Alle Produkte",
  categoryUids
}: CatalogPageProps) {
  const {
    sort,
    setSort,
    selectedColor,
    setSelectedColor,
    priceRange,
    setPriceRange,
    selectedRooms,
    setSelectedRooms,
    selectedMaterials,
    setSelectedMaterials,
    selectedSizes,
    setSelectedSizes,
    filtersOpen,
    setFiltersOpen,
    wideGrid,
    setWideGrid,
    hasActiveFilters,
    resetFilters
  } = useCatalogFilters();

  const facetsQuery = useFacets(categoryUids);

  const productsQuery = useProducts({
    pageSize: PAGE_SIZE,
    sort,
    color: selectedColor,
    priceRange,
    rooms: selectedRooms,
    materials: selectedMaterials,
    sizes: selectedSizes,
    categoryUids,
    searchKeyword: undefined
  });

  const products = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [productsQuery.data]
  );

  const firstPage = productsQuery.data?.pages?.[0];
  const colorOptions =
    facetsQuery.data?.colorOptions ?? firstPage?.colorOptions ?? [];
  const roomOptions =
    facetsQuery.data?.roomOptions ?? firstPage?.roomOptions ?? [];
  const materialOptions =
    facetsQuery.data?.materialOptions ?? firstPage?.materialOptions ?? [];
  const sizeOptions =
    facetsQuery.data?.sizeOptions ?? firstPage?.sizeOptions ?? [];
  const totalCount = firstPage?.totalCount ?? 0;
  const pageCount = productsQuery.data?.pages?.length ?? 0;

  const isLoading = productsQuery.isLoading;
  const isError = productsQuery.isError;
  const hasNextPage = productsQuery.hasNextPage;
  const isFetching = productsQuery.isFetching;
  const fetchNextPage = productsQuery.fetchNextPage;

  const gridColumns = wideGrid ? "lg:grid-cols-5" : "lg:grid-cols-4";
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage) return;
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isFetching) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, fetchNextPage]);
  const lastRequestedPage = useRef<number>(0);

  useEffect(() => {
    const cols = wideGrid ? 5 : 4;
    const remainder = products.length % cols;
    if (
      remainder !== 0 &&
      hasNextPage &&
      !isFetching &&
      lastRequestedPage.current < pageCount
    ) {
      lastRequestedPage.current = pageCount;
      fetchNextPage();
    }
  }, [
    products.length,
    wideGrid,
    hasNextPage,
    isFetching,
    fetchNextPage,
    pageCount
  ]);

  return (
    <section id="products">
      <div className="flex flex-col gap-8">
        <div className="w-full">
          <div className="flex flex-col items-center gap-2 text-center my-8 space-y-4 page-padding-x">
            <h2 className="text-4xl font-semibold text-slate-900 md:text-5xl">
              {title}
            </h2>
          </div>

          <QuickFilterBar
            totalCount={totalCount}
            isLoading={isLoading}
            onOpenFilters={() => setFiltersOpen(true)}
            onToggleGrid={() => setWideGrid((prev) => !prev)}
            hasActiveFilters={hasActiveFilters}
            onReset={resetFilters}
          />

          {isError ? (
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              Beim Laden der Produkte ist ein Fehler aufgetreten. Bitte
              versuchen Sie es erneut.
            </div>
          ) : null}

          <div
            className={`grid w-full grid-cols-2 gap-2.5 px-5 lg:gap-x-5 lg:gap-y-[65px] lg:px-[50px] ${gridColumns}`}
          >
            {isLoading
              ? Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-80 animate-pulse rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
                  >
                    <div className="h-40 rounded-xl bg-slate-200" />
                    <div className="mt-4 h-4 w-3/4 rounded bg-slate-200" />
                    <div className="mt-2 h-4 w-1/2 rounded bg-slate-200" />
                  </div>
                ))
              : products.map((product) => (
                  <ProductCard
                    key={product.urlKey ?? product.sku}
                    product={product}
                  />
                ))}
          </div>

          {!isLoading && products.length === 0 ? (
            <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-600">
              Keine Produkte gefunden. Versuchen Sie, die Filter anzupassen.
            </div>
          ) : null}

          {hasNextPage ? (
            <div className="mt-10 flex justify-center" ref={loadMoreRef}>
              <LoadMoreButton
                onClick={() => fetchNextPage()}
                disabled={isFetching}
              />
            </div>
          ) : null}
        </div>
      </div>

      <FiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        totalCount={totalCount}
        sort={sort}
        setSort={setSort}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        selectedRooms={selectedRooms}
        setSelectedRooms={setSelectedRooms}
        selectedMaterials={selectedMaterials}
        setSelectedMaterials={setSelectedMaterials}
        selectedSizes={selectedSizes}
        setSelectedSizes={setSelectedSizes}
        colorOptions={colorOptions}
        roomOptions={roomOptions}
        materialOptions={materialOptions}
        sizeOptions={sizeOptions}
        onReset={() => {
          resetFilters();
          setFiltersOpen(false);
        }}
      />
    </section>
  );
}

function useCatalogFilters() {
  const [sort, setSort] = useState<"price_asc" | "price_desc">("price_asc");
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [priceRange, setPriceRange] = useState<{ from?: number; to?: number }>(
    {}
  );
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [wideGrid, setWideGrid] = useState(true);

  const hasActiveFilters =
    Boolean(selectedColor) ||
    Boolean(priceRange.from) ||
    Boolean(priceRange.to) ||
    selectedRooms.length > 0 ||
    selectedMaterials.length > 0 ||
    selectedSizes.length > 0;

  const resetFilters = () => {
    setSelectedColor(undefined);
    setPriceRange({});
    setSelectedRooms([]);
    setSelectedMaterials([]);
    setSelectedSizes([]);
  };

  return {
    sort,
    setSort,
    selectedColor,
    setSelectedColor,
    priceRange,
    setPriceRange,
    selectedRooms,
    setSelectedRooms,
    selectedMaterials,
    setSelectedMaterials,
    selectedSizes,
    setSelectedSizes,
    filtersOpen,
    setFiltersOpen,
    wideGrid,
    setWideGrid,
    hasActiveFilters,
    resetFilters
  };
}

function QuickFilterBar({
  totalCount,
  isLoading,
  onOpenFilters,
  onToggleGrid,
  hasActiveFilters,
  onReset
}: {
  totalCount: number;
  isLoading: boolean;
  onOpenFilters: () => void;
  onToggleGrid: () => void;
  hasActiveFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 text-sm font-semibold text-slate-900 page-padding-x py-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onOpenFilters}
          className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-white px-6 py-2 shadow-sm transition hover:border-slate-700 cursor-pointer"
        >
          <span aria-hidden>⇅</span> Filter &amp; Sortieren
        </button>
        <button
          onClick={onOpenFilters}
          className="rounded-full border border-slate-900 bg-slate-900 px-6 py-2 text-white shadow-sm transition hover:bg-black cursor-pointer"
        >
          Alle
        </button>
        <button
          onClick={onOpenFilters}
          className="rounded-full border border-slate-900 bg-white px-6 py-2 shadow-sm transition hover:border-slate-700 cursor-pointer"
        >
          Wohnraum
        </button>
        <button
          onClick={onOpenFilters}
          className="rounded-full border border-slate-900 bg-white px-6 py-2 shadow-sm transition hover:border-slate-700 cursor-pointer"
        >
          Größe
        </button>
        <button
          onClick={onOpenFilters}
          className="rounded-full border border-slate-900 bg-white px-6 py-2 shadow-sm transition hover:border-slate-700 cursor-pointer"
        >
          Farben
        </button>
        {hasActiveFilters ? (
          <button
            onClick={onReset}
            className="rounded-full border border-slate-900 bg-slate-900 px-6 py-2 text-white shadow-sm transition hover:bg-black cursor-pointer"
          >
            <span aria-hidden>X</span> Filter zurücksetzen
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-base font-semibold text-slate-900">
          {isLoading ? "…" : `${totalCount} Produkte`}
        </span>
        <button
          type="button"
          className="hidden items-center gap-2 rounded-full border border-slate-900 bg-white px-6 py-2 text-sm shadow-sm transition hover:border-slate-700 cursor-pointer lg:inline-flex"
          onClick={onToggleGrid}
        >
          <span aria-hidden>👁</span> Grid Wechseln
        </button>
      </div>
    </div>
  );
}

function FiltersDrawer({
  open,
  onClose,
  totalCount,
  sort,
  setSort,
  selectedColor,
  setSelectedColor,
  priceRange,
  setPriceRange,
  selectedRooms,
  setSelectedRooms,
  selectedMaterials,
  setSelectedMaterials,
  selectedSizes,
  setSelectedSizes,
  colorOptions,
  roomOptions,
  materialOptions,
  sizeOptions,
  onReset
}: {
  open: boolean;
  onClose: () => void;
  totalCount: number;
  sort: "price_asc" | "price_desc";
  setSort: (v: "price_asc" | "price_desc") => void;
  selectedColor?: string;
  setSelectedColor: (val?: string) => void;
  priceRange: { from?: number; to?: number };
  setPriceRange: (range: { from?: number; to?: number }) => void;
  selectedRooms: string[];
  setSelectedRooms: (rooms: string[]) => void;
  selectedMaterials: string[];
  setSelectedMaterials: (materials: string[]) => void;
  selectedSizes: string[];
  setSelectedSizes: (sizes: string[]) => void;
  colorOptions: FilterOption[];
  roomOptions: FilterOption[];
  materialOptions: FilterOption[];
  sizeOptions: FilterOption[];
  onReset: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="h-full w-[420px] max-w-[95vw] translate-x-0 bg-white shadow-2xl ring-1 ring-slate-200 transition"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <p className="text-lg font-semibold text-slate-900">
            Filter &amp; Sortieren
          </p>
          <button
            onClick={onClose}
            aria-label="Filter schließen"
            className="text-2xl font-semibold text-slate-600 hover:text-slate-900"
          >
            ×
          </button>
        </div>
        <div className="flex h-[calc(100%-140px)] flex-col overflow-y-auto px-5 py-4">
          <div className="divide-y divide-slate-200">
            <FilterRow label="Sortieren nach" defaultOpen>
              <SortSelect value={sort} onChange={setSort} />
            </FilterRow>
            <FilterRow label="Farben" defaultOpen>
              <FiltersPanel
                selectedColor={selectedColor}
                priceRange={priceRange}
                colorOptions={colorOptions}
                roomOptions={roomOptions}
                materialOptions={materialOptions}
                sizeOptions={sizeOptions}
                selectedRooms={selectedRooms}
                selectedMaterials={selectedMaterials}
                selectedSizes={selectedSizes}
                onColorChange={setSelectedColor}
                onRoomsChange={setSelectedRooms}
                onMaterialsChange={setSelectedMaterials}
                onSizesChange={setSelectedSizes}
                onPriceRangeChange={setPriceRange}
                compact
                showPrice={false}
                showRooms={false}
                showMaterials={false}
                showSizes={false}
                showSectionTitles={false}
              />
            </FilterRow>
            <FilterRow label="Preis" defaultOpen>
              <FiltersPanel
                selectedColor={selectedColor}
                priceRange={priceRange}
                colorOptions={[]}
                materialOptions={[]}
                sizeOptions={[]}
                onColorChange={() => undefined}
                onPriceRangeChange={setPriceRange}
                compact
                showColor={false}
                showRooms={false}
                showMaterials={false}
                showSizes={false}
                showSectionTitles={false}
              />
            </FilterRow>
            <FilterRow label="Wohnraum">
              <FiltersPanel
                selectedRooms={selectedRooms}
                roomOptions={roomOptions}
                priceRange={priceRange}
                colorOptions={[]}
                materialOptions={[]}
                sizeOptions={[]}
                onPriceRangeChange={setPriceRange}
                onRoomsChange={setSelectedRooms}
                compact
                showColor={false}
                showPrice={false}
                showMaterials={false}
                showSizes={false}
                showSectionTitles={false}
              />
            </FilterRow>
            <FilterRow label="Material">
              <FiltersPanel
                selectedMaterials={selectedMaterials}
                materialOptions={materialOptions}
                priceRange={priceRange}
                colorOptions={[]}
                sizeOptions={[]}
                roomOptions={[]}
                onPriceRangeChange={setPriceRange}
                onMaterialsChange={setSelectedMaterials}
                compact
                showColor={false}
                showPrice={false}
                showRooms={false}
                showSizes={false}
                showSectionTitles={false}
              />
            </FilterRow>
            <FilterRow label="Größe">
              <FiltersPanel
                selectedSizes={selectedSizes}
                sizeOptions={sizeOptions}
                priceRange={priceRange}
                colorOptions={[]}
                materialOptions={[]}
                roomOptions={[]}
                onPriceRangeChange={setPriceRange}
                onSizesChange={setSelectedSizes}
                compact
                showColor={false}
                showPrice={false}
                showRooms={false}
                showMaterials={false}
                showSectionTitles={false}
              />
            </FilterRow>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-slate-200 px-5 py-4">
          <button
            onClick={onReset}
            className="flex-1 rounded-full border border-slate-900 px-4 py-3 text-sm font-semibold text-slate-900"
          >
            Zurücksetzen
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            {totalCount} Produkte anzeigen
          </button>
        </div>
      </div>
      <div
        className="h-full flex-1 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
    </div>
  );
}

function FilterRow({
  label,
  children,
  defaultOpen = true
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="py-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between"
        aria-expanded={open}
        aria-label={`${open ? "Zuklappen" : "Aufklappen"} ${label}`}
      >
        <p className="text-base font-semibold text-slate-800">{label}</p>
        <span className="text-xl text-slate-500">{open ? "−" : "+"}</span>
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
