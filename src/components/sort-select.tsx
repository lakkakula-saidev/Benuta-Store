const options = [
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export function SortSelect({
  value,
  onChange,
}: {
  value: "price_asc" | "price_desc";
  onChange: (value: "price_asc" | "price_desc") => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as "price_asc" | "price_desc")}
        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
