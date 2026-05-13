import Image from "next/image";
import Link from "next/link";
import { brandAssets, navLinks, primaryServices, site, suburbGroups } from "@/lib/site";
import { Icon } from "./Icon";

export function Footer() {
  const year = new Date().getFullYear();
  const suburbs = suburbGroups.flatMap((group) => group.suburbs).slice(0, 12);

  return (
    <footer className="relative overflow-hidden bg-brand-navy text-white">
      <div className="absolute inset-0 opacity-30" aria-hidden="true">
        <div className="h-full w-full bg-water-grid bg-[length:26px_26px]" />
      </div>
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.9fr_0.9fr] lg:px-8">
        <div>
          <Image
            alt={brandAssets.logo.alt}
            className="h-auto w-32 rounded-md bg-white p-2 shadow-sm"
            height={brandAssets.logo.height}
            src={brandAssets.logo.src}
            width={brandAssets.logo.width}
          />
          <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100">
            {site.description}
          </p>
          <div className="mt-6 grid gap-3 text-sm text-blue-100">
            <a className="inline-flex items-center gap-2 hover:text-white" href={site.phoneHref}>
              <Icon name="phone" className="h-4 w-4" />
              {site.phone}
            </a>
            <a className="inline-flex items-center gap-2 hover:text-white" href={site.emailHref}>
              <Icon name="mail" className="h-4 w-4" />
              {site.email}
            </a>
            <span>{site.serviceArea}</span>
          </div>
        </div>

        <div>
          <h2 className="font-display text-base font-bold">Quick links</h2>
          <ul className="mt-4 grid gap-3 text-sm text-blue-100">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link className="hover:text-white" href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-base font-bold">Services</h2>
          <ul className="mt-4 grid gap-3 text-sm text-blue-100">
            {primaryServices.slice(0, 7).map((service) => (
              <li key={service.title}>
                <Link className="hover:text-white" href={service.href}>
                  {service.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-base font-bold">Suburbs</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 text-sm text-blue-100">
            {suburbs.map((suburb) => (
              <li key={suburb}>{suburb}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10 px-4 py-5 text-center text-xs text-blue-100 sm:px-6 lg:px-8">
        Copyright {year} Grade A Plumbing. All rights reserved.
      </div>
    </footer>
  );
}
