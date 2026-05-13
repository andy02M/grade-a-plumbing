"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { brandAssets, navLinks, site } from "@/lib/site";
import { ButtonLink } from "./ButtonLink";
import { Icon } from "./Icon";

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4 lg:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="glass-surface flex min-h-[4.75rem] items-center justify-between gap-3 rounded-[1.75rem] px-4 sm:px-5 xl:rounded-full xl:px-6">
            <Link aria-label="Grade A Plumbing home" className="flex min-w-0 items-center gap-3" href="/">
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-white/70 sm:h-12 sm:w-12">
                <Image
                  alt={brandAssets.logo.alt}
                  className="object-cover object-top scale-[1.55]"
                  fill
                  sizes="48px"
                  src={brandAssets.logo.src}
                />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-[1.08rem] font-bold uppercase leading-none tracking-[0.04em] text-brand-navy sm:text-[1.55rem] xl:text-[1.8rem]">
                  Grade A Plumbing
                </span>
                <span className="hidden truncate text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:block sm:text-[0.72rem]">
                  Melbourne VIC
                </span>
              </span>
            </Link>

            <nav aria-label="Primary navigation" className="hidden items-center gap-1 xl:flex">
              {navLinks.map((link) => {
                const isActive = isActivePath(pathname, link.href);

                return (
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "bg-white text-brand-blue shadow-sm"
                        : "text-slate-700 hover:bg-white/80 hover:text-brand-blue"
                    }`}
                    href={link.href}
                    key={link.href}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden items-center gap-3 xl:flex">
              <ButtonLink className="gap-2 px-4" href={site.phoneHref}>
                <Icon name="phone" className="h-4 w-4" />
                Call {site.phone}
              </ButtonLink>
              <ButtonLink className="gap-2 px-4" href="/contact#book-appointment" variant="secondary">
                <Icon name="clock" className="h-4 w-4" />
                Book Appointment
              </ButtonLink>
              <ButtonLink className="px-4" href="/contact" variant="secondary">
                Free Quote
              </ButtonLink>
            </div>

            <div className="flex items-center gap-2 xl:hidden">
              <a
                aria-label={`Call ${site.phone}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/80 text-brand-navy shadow-sm transition hover:bg-white sm:h-11 sm:w-11"
                href={site.phoneHref}
              >
                <Icon name="phone" className="h-4 w-4" />
              </a>
              <button
                aria-controls="mobile-navigation"
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/80 text-brand-navy shadow-sm transition hover:bg-white sm:h-11 sm:w-11"
                onClick={() => setIsMenuOpen((current) => !current)}
                type="button"
              >
                <Icon className="h-5 w-5" name={isMenuOpen ? "close" : "menu"} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-[#08172a]/48 backdrop-blur-sm transition duration-200 xl:hidden ${
          isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      <div
        className={`fixed inset-x-3 top-[5.6rem] z-50 mx-auto max-w-7xl transition duration-200 sm:inset-x-4 sm:top-[5.85rem] lg:inset-x-6 xl:hidden ${
          isMenuOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
        }`}
      >
        <div className="glass-surface overflow-hidden rounded-[2rem] p-3 shadow-[0_28px_80px_rgba(8,23,42,0.28)]">
          <div className="rounded-[1.5rem] bg-white/70 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">
              Grade A Plumbing
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Emergency plumbing, blocked drains, hot water repairs, and commercial plumbing across Melbourne and surrounding suburbs.
            </p>
          </div>

          <nav aria-label="Mobile navigation" className="mt-3 grid gap-2" id="mobile-navigation">
            {navLinks.map((link) => {
              const isActive = isActivePath(pathname, link.href);

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-[1.25rem] px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-brand-blue text-white shadow-sm"
                      : "bg-white/72 text-slate-700 hover:bg-white hover:text-brand-blue"
                  }`}
                  href={link.href}
                  key={link.href}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-3 grid gap-2 border-t border-slate-200/60 pt-3 sm:grid-cols-2">
            <ButtonLink className="gap-2" href={site.phoneHref}>
              <Icon name="phone" className="h-4 w-4" />
              Call Now
            </ButtonLink>
            <ButtonLink href="/contact#book-appointment" onClick={() => setIsMenuOpen(false)} variant="secondary">
              Book Appointment
            </ButtonLink>
            <ButtonLink href="/contact" onClick={() => setIsMenuOpen(false)} variant="secondary">
              Request a Free Quote
            </ButtonLink>
          </div>
        </div>
      </div>
    </>
  );
}
