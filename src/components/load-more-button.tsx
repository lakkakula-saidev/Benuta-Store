export function LoadMoreButton({
  onClick,
  disabled
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:translate-y--1px hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
    >
      {disabled ? "Lädt..." : "Mehr laden"}
    </button>
  );
}
