import { suburbGroups } from "@/lib/site";

export function ServiceAreaGrid({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "grid gap-5 md:grid-cols-2" : "grid gap-6 lg:grid-cols-2"}>
      {suburbGroups.map((group) => (
        <section
          aria-labelledby={`${group.region.replace(/\s+/g, "-").toLowerCase()}-heading`}
          className="glass-surface rounded-md p-5"
          key={group.region}
        >
          <h3
            className="font-display text-lg font-black text-brand-navy"
            id={`${group.region.replace(/\s+/g, "-").toLowerCase()}-heading`}
          >
            {group.region}
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {group.suburbs.map((suburb) => (
              <span
                className="rounded-full border border-blue-100 bg-brand-sky px-3 py-1.5 text-sm font-semibold text-brand-charcoal"
                key={suburb}
              >
                {suburb}
              </span>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
