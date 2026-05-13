import { Icon } from "./Icon";

export function TrustBadge({
  label,
  tone = "light"
}: {
  label: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold shadow-sm backdrop-blur ${
        dark
          ? "border border-white/18 bg-white/8 text-white"
          : "border border-white/30 bg-white/72 text-brand-charcoal"
      }`}
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full ${
          dark ? "bg-white text-brand-blue" : "bg-white text-brand-blue"
        }`}
      >
        <Icon name="check" className="h-3.5 w-3.5" />
      </span>
      {label}
    </span>
  );
}
