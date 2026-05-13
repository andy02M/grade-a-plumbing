import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/site";

export function Breadcrumbs({ items }: { items: readonly BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li className="flex items-center gap-2" key={item.href}>
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {isLast ? (
                <span className="font-semibold text-brand-charcoal">{item.name}</span>
              ) : (
                <Link className="hover:text-brand-blue" href={item.href}>
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
