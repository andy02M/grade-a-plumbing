import Link from "next/link";
import { Icon, type IconName } from "./Icon";

type ServiceCardProps = {
  title: string;
  description: string;
  href: string;
  icon: IconName | string;
};

export function ServiceCard({ title, description, href, icon }: ServiceCardProps) {
  return (
    <Link
      className="group relative overflow-hidden rounded-md border border-slate-200/80 bg-white/75 p-6 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-soft"
      href={href}
    >
      <div className="absolute right-5 top-5 text-xs font-bold tracking-[0.24em] text-slate-300">
        {href === "/contact" ? "PLUS" : "VIEW"}
      </div>
      <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-sky text-brand-blue transition group-hover:bg-brand-blue group-hover:text-white">
        <Icon name={icon as IconName} />
      </span>
      <h3 className="mt-8 font-display text-2xl font-semibold leading-tight text-brand-navy">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <span className="mt-6 inline-flex text-sm font-bold text-brand-blue">Learn more</span>
    </Link>
  );
}
