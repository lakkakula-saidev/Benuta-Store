import { colorSwatchClass } from "../utils/color";

type PriceRange = { from?: number; to?: number };
type FilterOption = { label: string; value: string; count?: number };

function dedupeOptions(options: FilterOption[] = []): FilterOption[] {
  const map = new Map<string, FilterOption>();
  options.forEach((opt) => {
    if (!opt?.value) return;
    const key = String(opt.value);
    if (!map.has(key)) {
      map.set(key, opt);
    } else {
      const prev = map.get(key)!;
      map.set(key, {
        ...prev,
        label: prev.label || opt.label,
        count: opt.count ?? prev.count
      });
    }
  });
  return Array.from(map.values());
}

export function FiltersPanel({
  selectedColor,
  priceRange,
  colorOptions,
  selectedRooms,
  roomOptions,
  selectedMaterials,
  materialOptions,
  selectedSizes,
  sizeOptions,
  onColorChange,
  onRoomsChange,
  onMaterialsChange,
  onSizesChange,
  onPriceRangeChange,
  showColor = true,
  showPrice = true,
  showRooms = true,
  showMaterials = true,
  showSizes = true,
  showSectionTitles = false,
  compact = false
}: {
  selectedColor?: string;
  selectedRooms?: string[];
  selectedMaterials?: string[];
  selectedSizes?: string[];
  priceRange: PriceRange;
  colorOptions: Array<{ label: string; value: string; count?: number }>;
  roomOptions?: Array<{ label: string; value: string; count?: number }>;
  materialOptions?: Array<{ label: string; value: string; count?: number }>;
  sizeOptions?: Array<{ label: string; value: string; count?: number }>;
  onColorChange?: (color?: string) => void;
  onRoomsChange?: (rooms: string[]) => void;
  onMaterialsChange?: (materials: string[]) => void;
  onSizesChange?: (sizes: string[]) => void;
  onPriceRangeChange: (range: PriceRange) => void;
  showColor?: boolean;
  showPrice?: boolean;
  showRooms?: boolean;
  showMaterials?: boolean;
  showSizes?: boolean;
  showSectionTitles?: boolean;
  compact?: boolean;
}) {
  const uniqueColors = dedupeOptions(colorOptions);
  const uniqueRooms = dedupeOptions(roomOptions ?? []);
  const uniqueMaterials = dedupeOptions(materialOptions ?? []);
  const uniqueSizes = dedupeOptions(sizeOptions ?? []);

  const clearFilters = () => {
    onColorChange?.(undefined);
    onPriceRangeChange({});
    onRoomsChange?.([]);
    onMaterialsChange?.([]);
    onSizesChange?.([]);
  };

  return (
    <div
      className={
        compact
          ? "space-y-6"
          : "rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
      }
    >
      {!compact ? (
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Filter</h2>
          <button
            onClick={clearFilters}
            className="text-sm font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
          >
            Clear
          </button>
        </div>
      ) : null}

      <div className="space-y-6">
        {showColor ? (
          <div>
            {showSectionTitles ? (
              <h3 className="text-sm font-semibold text-slate-800">Color</h3>
            ) : null}
            {uniqueColors.length ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onColorChange?.(undefined)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                    !selectedColor
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                  }`}
                  aria-pressed={!selectedColor}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border border-slate-300 bg-slate-200" />
                    All
                  </span>
                </button>
                {uniqueColors.map((color) => {
                  const selected = selectedColor === color.value;
                  return (
                    <button
                      type="button"
                      key={color.value}
                      onClick={() =>
                        onColorChange?.(selected ? undefined : color.value)
                      }
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                        selected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                      }`}
                      aria-pressed={selected}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-4 w-4 rounded-full border border-slate-300 ${colorSwatchClass(
                            color.label
                          )}`}
                          aria-hidden
                        />
                        {color.label}
                      </span>
                      {color.count ? (
                        <span
                          className={`text-xs ${
                            selected ? "text-white/80" : "text-slate-600"
                          }`}
                        >
                          {color.count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">No colors available</p>
            )}
          </div>
        ) : null}

        {showPrice ? (
          <div>
            {showSectionTitles ? (
              <h3 className="text-sm font-semibold text-slate-800">
                Price (€)
              </h3>
            ) : null}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.from?.toString() ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  onPriceRangeChange({
                    from: value ? Number(value) : undefined,
                    to: priceRange.to
                  });
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
              <input
                type="number"
                placeholder="Max"
                value={priceRange.to?.toString() ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  onPriceRangeChange({
                    from: priceRange.from,
                    to: value ? Number(value) : undefined
                  });
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
        ) : null}

        {showMaterials && uniqueMaterials.length ? (
          <div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {uniqueMaterials.map((material) => {
                const checked =
                  selectedMaterials?.includes(material.value) ?? false;
                return (
                  <label
                    key={material.value}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 hover:border-slate-300"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-slate-900"
                        checked={checked}
                        onChange={(e) => {
                          if (!onMaterialsChange) return;
                          const next = new Set(selectedMaterials ?? []);
                          if (e.target.checked) {
                            next.add(material.value);
                          } else {
                            next.delete(material.value);
                          }
                          onMaterialsChange(Array.from(next));
                        }}
                      />
                      <span>{material.label}</span>
                    </div>
                    {material.count ? (
                      <span className="text-xs text-slate-600">
                        {material.count}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}

        {showSizes && uniqueSizes.length ? (
          <div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {uniqueSizes.map((size) => {
                const checked = selectedSizes?.includes(size.value) ?? false;
                return (
                  <label
                    key={size.value}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 hover:border-slate-300"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-slate-900"
                        checked={checked}
                        onChange={(e) => {
                          if (!onSizesChange) return;
                          const next = new Set(selectedSizes ?? []);
                          if (e.target.checked) {
                            next.add(size.value);
                          } else {
                            next.delete(size.value);
                          }
                          onSizesChange(Array.from(next));
                        }}
                      />
                      <span>{size.label}</span>
                    </div>
                    {size.count ? (
                      <span className="text-xs text-slate-600">
                        {size.count}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}

        {showRooms && uniqueRooms.length ? (
          <div>
            {showSectionTitles ? (
              <h3 className="text-sm font-semibold text-slate-800">Wohnraum</h3>
            ) : null}
            <div className="mt-3 grid grid-cols-1 gap-2">
              {uniqueRooms.map((room) => {
                const checked = selectedRooms?.includes(room.value) ?? false;
                return (
                  <label
                    key={room.value}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 hover:border-slate-300"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-slate-900"
                        checked={checked}
                        onChange={(e) => {
                          if (!onRoomsChange) return;
                          const current = new Set(selectedRooms ?? []);
                          if (e.target.checked) {
                            current.add(room.value);
                          } else {
                            current.delete(room.value);
                          }
                          onRoomsChange(Array.from(current));
                        }}
                      />
                      <span>{room.label}</span>
                    </div>
                    {room.count ? (
                      <span className="text-xs text-slate-600">
                        {room.count}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}
