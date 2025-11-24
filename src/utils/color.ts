export function colorSwatchClass(label?: string | null): string {
  if (!label) return "bg-slate-400";

  const normalized = label.trim().toLowerCase();
  const matchers: Array<{ token: string; className: string }> = [
    { token: "blue", className: "bg-blue-500" },
    { token: "green", className: "bg-green-500" },
    { token: "red", className: "bg-red-500" },
    { token: "beige", className: "bg-amber-200" },
    { token: "sand", className: "bg-amber-200" },
    { token: "grey", className: "bg-slate-500" },
    { token: "gray", className: "bg-slate-500" },
    { token: "brown", className: "bg-amber-700" },
    { token: "taupe", className: "bg-amber-700" },
    { token: "black", className: "bg-black" },
    { token: "white", className: "bg-white" },
    { token: "yellow", className: "bg-amber-400" },
    { token: "gold", className: "bg-amber-400" },
    { token: "pink", className: "bg-pink-400" },
    { token: "rose", className: "bg-pink-400" },
  ];

  const match = matchers.find(({ token }) => normalized.includes(token));
  return match ? match.className : "bg-slate-400";
}
