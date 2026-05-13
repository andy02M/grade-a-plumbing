import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "light" | "ghost";
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  rel?: string;
  target?: string;
};

const variants = {
  primary:
    "rounded-full bg-brand-blue text-white shadow-lift hover:bg-blue-700 focus-visible:outline-brand-blue",
  secondary:
    "rounded-full border border-white/40 bg-white/80 text-brand-navy backdrop-blur hover:border-brand-blue/40 hover:bg-white focus-visible:outline-brand-blue",
  light:
    "rounded-full bg-white text-brand-navy shadow-soft hover:bg-brand-sky focus-visible:outline-white",
  ghost:
    "rounded-full border border-white/24 bg-white/10 text-white backdrop-blur hover:bg-white/16 focus-visible:outline-white"
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
  onClick,
  rel,
  target
}: ButtonLinkProps) {
  const isExternalAction =
    href.startsWith("tel:") || href.startsWith("mailto:") || href.startsWith("http");
  const classes = `inline-flex min-h-12 items-center justify-center px-5 py-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${variants[variant]} ${className}`;

  if (isExternalAction) {
    return (
      <a className={classes} href={href} onClick={onClick} rel={rel} target={target}>
        {children}
      </a>
    );
  }

  return (
    <Link className={classes} href={href} onClick={onClick}>
      {children}
    </Link>
  );
}
