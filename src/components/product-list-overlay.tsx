"use client";

import { useEffect, useRef } from "react";
import type { SavedProduct } from "../context/shop-lists";

type ProductListOverlayProps = {
  title: string;
  items: SavedProduct[];
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
  onIncrement?: (item: SavedProduct) => void;
  onDecrement?: (item: SavedProduct) => void;
  onRemove?: (item: SavedProduct) => void;
};

export function ProductListOverlay({
  title,
  items,
  onClose,
  anchorRef,
  onIncrement,
  onDecrement,
  onRemove
}: ProductListOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const showQuantityControls = Boolean(onIncrement || onDecrement);
  const totalPrice = showQuantityControls
    ? items.reduce((sum, item) => {
        if (!item.price?.value) return sum;
        return sum + item.price.value * (item.quantity ?? 1);
      }, 0)
    : 0;
  const currency =
    items.find((item) => item.price?.currency)?.price?.currency ?? "EUR";

  useEffect(() => {
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        overlayRef.current &&
        !overlayRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, anchorRef]);

  return (
    <div
      ref={overlayRef}
      className="absolute right-0 top-full mt-3 w-[620px] rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 shadow-xl"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-base font-semibold">{title}</p>
          <p className="text-xs text-slate-500">
            {items.length} {items.length === 1 ? "Produkt" : "Produkte"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400"
        >
          Schließen
        </button>
      </div>
      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-xs text-slate-500">Noch keine Produkte.</p>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3"
            >
              <div className="min-w-240px flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-sm font-semibold">
                      {item.name ?? "Produkt"}
                    </span>
                    <span className="block text-xs text-slate-500">
                      Variante: {item.variant ?? "Standard"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {showQuantityControls ? (
                      <div className="flex items-center gap-2">
                        {onDecrement ? (
                          <button
                            type="button"
                            onClick={() => onDecrement(item)}
                            className="h-6 w-6 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                            disabled={(item.quantity ?? 1) <= 1}
                          >
                            −
                          </button>
                        ) : null}
                        <span className="text-xs font-semibold text-slate-600">
                          Menge: {item.quantity ?? 1}
                        </span>
                        {onIncrement ? (
                          <button
                            type="button"
                            onClick={() => onIncrement(item)}
                            className="h-6 w-6 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                          >
                            +
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                    {onRemove ? (
                      <button
                        type="button"
                        onClick={() => onRemove(item)}
                        className="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 transition hover:border-red-400 hover:text-red-500"
                      >
                        Entfernen
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="block mt-1 text-xs text-slate-500">
                  Nr.: {item.sku ?? "—"}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {showQuantityControls && totalPrice > 0 ? (
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-sm font-semibold text-slate-900">
          <span>Gesamtsumme</span>
          <span>
            {new Intl.NumberFormat("de-DE", {
              style: "currency",
              currency
            }).format(totalPrice)}
          </span>
        </div>
      ) : null}
    </div>
  );
}
