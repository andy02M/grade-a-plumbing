import { coreServiceLocations } from "@/lib/site";

type CoreLocationCardsProps = {
  tone?: "light" | "dark";
};

export function CoreLocationCards({ tone = "light" }: CoreLocationCardsProps) {
  const dark = tone === "dark";

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {coreServiceLocations.map((location) => (
        <article
          className={`rounded-[1.5rem] border p-5 shadow-sm ${
            dark
              ? "border-white/12 bg-white/10 text-white"
              : "border-slate-200 bg-white text-brand-charcoal"
          }`}
          key={location.suburb}
        >
          <p
            className={`text-xs font-bold uppercase tracking-[0.18em] ${
              dark ? "text-blue-100" : "text-brand-blue"
            }`}
          >
            {location.suburb}
          </p>
          <h3
            className={`mt-3 font-display text-2xl font-bold uppercase leading-none ${
              dark ? "text-white" : "text-brand-navy"
            }`}
          >
            {location.title}
          </h3>
          <p className={`mt-4 text-sm leading-7 ${dark ? "text-blue-50/85" : "text-slate-600"}`}>
            {location.description}
          </p>
          <p className={`mt-4 text-sm font-semibold leading-7 ${dark ? "text-white" : "text-brand-charcoal"}`}>
            {location.searchFocus}
          </p>
        </article>
      ))}
    </div>
  );
}
