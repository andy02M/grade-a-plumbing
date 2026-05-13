import type { FaqItem } from "@/lib/site";

export function FAQ({ items }: { items: readonly FaqItem[] }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <details
          className="group rounded-md border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur"
          key={item.question}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-bold text-brand-navy">
            {item.question}
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-sky text-brand-blue transition group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
