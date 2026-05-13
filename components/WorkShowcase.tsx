import Image from "next/image";
import { ButtonLink } from "@/components/ButtonLink";
import { recentWorkItems } from "@/lib/site";

type WorkShowcaseProps = {
  title: string;
  description: string;
  eyebrow?: string;
  limit?: number;
  background?: "plain" | "tint";
  note?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function WorkShowcase({
  title,
  description,
  eyebrow = "Recent plumbing work",
  limit,
  background = "plain",
  note,
  actionHref,
  actionLabel
}: WorkShowcaseProps) {
  const items = recentWorkItems.slice(0, limit);
  const [featuredItem, ...galleryItems] = items;

  if (!featuredItem) {
    return null;
  }

  return (
    <section className={background === "tint" ? "bg-white/55 py-20 backdrop-blur" : "py-20"}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-blue">{eyebrow}</p>
            <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.9] tracking-[0.03em] text-brand-navy sm:text-6xl">
              {title}
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-slate-600">{description}</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <article className="group overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-soft">
            <div className="relative aspect-[16/10] bg-slate-100">
              <Image
                alt={featuredItem.image.alt}
                className="object-cover transition duration-500 group-hover:scale-[1.02]"
                fill
                sizes="(min-width: 1024px) 52vw, 100vw"
                src={featuredItem.image.src}
              />
            </div>
            <div className="p-6">
              <span className="inline-flex rounded-full border border-blue-100 bg-brand-sky px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-blue">
                {featuredItem.category}
              </span>
              <h3 className="mt-4 font-display text-3xl font-bold uppercase leading-none text-brand-navy sm:text-4xl">
                {featuredItem.title}
              </h3>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">{featuredItem.description}</p>
            </div>
          </article>

          <div className="grid gap-6 sm:grid-cols-2">
            {galleryItems.map((item) => (
              <article
                className="overflow-hidden rounded-[1.75rem] border border-white/60 bg-white shadow-soft"
                key={item.image.src}
              >
                <div className={`relative ${item.aspectClass} bg-slate-100`}>
                  <Image
                    alt={item.image.alt}
                    className="object-cover"
                    fill
                    sizes="(min-width: 1024px) 24vw, (min-width: 640px) 42vw, 100vw"
                    src={item.image.src}
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-blue">{item.category}</p>
                  <h3 className="mt-3 font-display text-2xl font-bold uppercase leading-none text-brand-navy">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        {(note || (actionHref && actionLabel)) && (
          <div className="glass-surface mt-8 flex flex-col gap-4 rounded-[1.5rem] p-5 lg:flex-row lg:items-center lg:justify-between">
            <p className="max-w-3xl text-sm leading-7 text-slate-600">
              {note ?? "Have a similar plumbing job? Send us a photo with your quote request so we can understand the work before we call you back."}
            </p>
            {actionHref && actionLabel ? (
              <ButtonLink href={actionHref} variant="secondary">
                {actionLabel}
              </ButtonLink>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
