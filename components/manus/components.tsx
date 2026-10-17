"use client";
import { ContactForm } from "../ContactForm";
import { usePathname } from "next/navigation";
import {
  FormEvent,
  ReactNode,
  useEffect,
  useId,
  useState,
  useRef,
} from "react";
import { gallery, PHONE, PHONE_LINK, services } from "./data";
import { googleBusinessRegister, googleReviewSummary } from "@/lib/google-business-profiles";
import { LocationAutocomplete } from "./LocationFeatures";
import {
  loadLocationById,
  locationLabel,
  type LocationRecord,
} from "./locationData";

type IconName =
  | "arrow"
  | "phone"
  | "menu"
  | "close"
  | "clock"
  | "building"
  | "pin"
  | "shield"
  | "chat"
  | "bulb"
  | "doc"
  | "check"
  | "search"
  | "upload"
  | "star"
  | "external";

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  const paths: Record<IconName, ReactNode> = {
    arrow: (
      <>
        <path d="M4 12h15" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    phone: (
      <>
        <path d="M6.5 3.5 9 3l2 5-2 1.5a13.4 13.4 0 0 0 5.5 5.5L16 13l5 2 .5 2.5A3 3 0 0 1 18.6 21C10 20.4 3.6 14 3 5.4A3 3 0 0 1 6.5 3.5Z" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    building: (
      <>
        <path d="M5 21V6l7-3v18" />
        <path d="M12 21h7V9l-7-2" />
        <path d="M8 8h1M8 12h1M8 16h1M15 11h1M15 15h1M15 19h1" />
      </>
    ),
    pin: (
      <>
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="10" r="2.2" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
    chat: (
      <>
        <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2h9A3.5 3.5 0 0 1 20 5.5v5a3.5 3.5 0 0 1-3.5 3.5H12l-4.5 4v-4H7.5A3.5 3.5 0 0 1 4 10.5Z" />
      </>
    ),
    bulb: (
      <>
        <path d="M9 18h6M10 21h4" />
        <path d="M8.5 14.5C7.6 13.4 7 12 7 10.5a5 5 0 0 1 10 0c0 1.5-.6 2.9-1.5 4-.6.7-1 1.2-1 2.5h-5c0-1.3-.4-1.8-1-2.5Z" />
      </>
    ),
    doc: (
      <>
        <path d="M6 3h9l3 3v15H6Z" />
        <path d="M15 3v4h4M9 12h6M9 16h6" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.2" />
        <path d="m16 16 4 4" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4M8 8l4-4 4 4" />
        <path d="M5 14v5h14v-5" />
      </>
    ),
    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" />
    ),
    external: (
      <>
        <path d="M14 5h5v5" />
        <path d="m19 5-8 8" />
        <path d="M19 14v5H5V5h5" />
      </>
    ),
  };
  return <svg {...common}>{paths[name]}</svg>;
}

export function Button({
  href,
  children,
  variant = "primary",
  type = "button",
  onClick,
  className = "",
  disabled = false,
}: {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "outline" | "dark";
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  const content = (
    <>
      {children}
      <Icon name="arrow" size={15} />
    </>
  );
  const classes = `button button-${variant} ${className}`;
  return href ? (
    <a className={classes} href={href}>
      {content}
    </a>
  ) : (
    <button
      className={classes}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </button>
  );
}

export function Logo({ invert = false }: { invert?: boolean }) {
  return (
    <a
      className={`logo ${invert ? "logo-invert" : ""}`}
      href="/"
      aria-label="Grade A Plumbing home"
    >
      <img
        src="/assets/GradeAPlumberLogo-horizontal.png"
        alt="Grade A Plumbing"
      />
    </a>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const nav = [
    ["Services", "/services/"],
    ["Service Areas", "/service-areas/"],
    ["Plumbing Advice", "/blog/"],
    ["Our Work", "/our-work/"],
    ["About", "/about/"],
    ["Contact", "/contact/"],
  ];
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <nav
          className={`desktop-nav ${open ? "nav-open" : ""}`}
          aria-label="Primary navigation"
        >
          {nav.map(([label, href]) => {
            const active = pathname === href || pathname.startsWith(`${href.replace(/\/$/, "")}/`);
            return (
            <a key={href} href={href} className={active ? "nav-link-active" : undefined} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>
              {label}
              {label === "Services" && <span className="nav-chevron">⌄</span>}
            </a>
            );
          })}
        </nav>
        <div className="header-actions">
          <a className="header-phone" href={PHONE_LINK}>
            <Icon name="phone" size={15} />
            <span>{PHONE}</span>
          </a>
          <Button onClick={() => window.dispatchEvent(new Event("open-quote"))}>
            Request a Quote
          </Button>
          <button
            className="menu-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const serviceColumns = [services.slice(0, 6), services.slice(6, 12)];
  const explore = [
    ["Home", "/"],
    ["Our Work", "/our-work/"],
    ["Service Areas", "/service-areas/"],
    ["About", "/about-us/"],
    ["Reviews", "/reviews/"],
    ["Contact", "/contact-us/"],
  ];
  const icon = (name: string) => `/assets/footer/icons/${name}.svg`;
  return (
    <footer
      className="site-footer premium-footer"
      aria-label="Grade A Plumbing footer"
    >
      <div className="premium-footer-bg" aria-hidden="true" />
      <div className="container premium-footer-inner">
        <div className="premium-footer-columns">
          <section className="premium-footer-brand">
            <a
              className="premium-footer-logo"
              href="/"
              aria-label="Grade A Plumbing home"
            >
              <img
                src="/assets/footer/grade-a-plumber-footer-white-blue-transparent.png"
                alt="Grade A Plumber — Quality You Can Trust"
              />
            </a>
            <p>
              Local residential, commercial and emergency plumbing services
              across Melbourne and surrounding suburbs.
            </p>
            <div className="premium-social" aria-label="Social media profiles">
              <a
                className="premium-social-icon"
                href="https://www.facebook.com/profile.php?id=61594890159299"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Grade A Plumbing on Facebook"
              >
                <img src={icon("facebook")} alt="" />
              </a>
              <a
                className="premium-social-icon"
                href="https://www.facebook.com/profile.php?id=61589874502109"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Grade A Plumbing Facebook profile"
              >
                <img src={icon("facebook")} alt="" />
              </a>
              <a
                className="premium-social-icon"
                href="https://www.instagram.com/gradea.plumbing/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Grade A Plumbing on Instagram"
              >
                <img src={icon("instagram")} alt="" />
              </a>
              <a
                className="premium-social-icon premium-social-tiktok"
                href="https://www.tiktok.com/@gradeaplumbing"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Grade A Plumbing on TikTok"
              >
                <span aria-hidden="true">♪</span>
              </a>
            </div>
          </section>
          <nav className="premium-footer-services" aria-label="Footer services">
            <h2>Services</h2>
            <div className="premium-service-columns">
              {serviceColumns.map((column, index) => (
                <div key={index}>
                  {column.map((service) => (
                    <a key={service.slug} href={service.route}>
                      {service.title}
                      <img src={icon("chevron-right")} alt="" />
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </nav>
          <nav
            className="premium-footer-explore"
            aria-label="Footer navigation"
          >
            <h2>Explore</h2>
            <div>
              {explore.map(([label, href]) => (
                <a key={href} href={href}>
                  {label}
                  <img src={icon("chevron-right")} alt="" />
                </a>
              ))}
            </div>
          </nav>
          <section className="premium-footer-contact">
            <h2>Get in touch</h2>
            <a className="premium-contact-row" href="tel:+61258375457">
              <img src={icon("phone")} alt="" />
              <span>
                <b>(02) 5837 5457</b>
                <small>Available 24/7 for emergencies</small>
              </span>
            </a>
            <a
              className="premium-contact-row"
              href="mailto:support@gradeaplumbing.store"
            >
              <img src={icon("mail")} alt="" />
              <span>
                <b>support@gradeaplumbing.store</b>
                <small>We'll respond as soon as possible</small>
              </span>
            </a>
            <div className="premium-contact-row">
              <img src={icon("map-pin")} alt="" />
              <span>
                <b>Melbourne, VIC</b>
                <small>Serving Melbourne and surrounding suburbs</small>
              </span>
            </div>
          </section>
        </div>
        <div className="premium-trust-bar">
          <div>
            <img src={icon("clock")} alt="" />
            <span>
              <b>24/7</b>
              <small>Emergency Plumbing</small>
            </span>
          </div>
          <div>
            <img src={icon("building")} alt="" />
            <span>
              <b>Residential &amp;</b>
              <small>Commercial</small>
            </span>
          </div>
          <div>
            <img src={icon("map-pin")} alt="" />
            <span>
              <b>Melbourne-Wide</b>
              <small>Service</small>
            </span>
          </div>
          <div>
            <img src={icon("shield-check")} alt="" />
            <span>
              <b>Quality You</b>
              <small>Can Trust</small>
            </span>
          </div>
        </div>
      </div>
      <div className="premium-footer-bottom">
        <div className="container">
          <span>
            © {new Date().getFullYear()} Grade A Plumbing. All rights reserved.
          </span>
          <nav aria-label="Legal and site links">
            <a href="/sitemap.xml">Sitemap</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  action,
  light = false,
}: {
  eyebrow: string;
  title: ReactNode;
  body?: string;
  action?: ReactNode;
  light?: boolean;
}) {
  return (
    <div className={`section-heading ${light ? "section-heading-light" : ""}`}>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {body && <p>{body}</p>}
      </div>
      {action}
    </div>
  );
}

export function TrustStrip({ showGoogleRating = false }: { showGoogleRating?: boolean } = {}) {
  const items = [
    ["clock", "24/7", "Emergency Plumbing"],
    ["building", "Residential &", "Commercial"],
    ["pin", "Melbourne-Wide", "Service"],
    ["shield", "Quality You", "Can Trust"],
  ] as const;
  const hasActiveGoogleProfiles = googleBusinessRegister.some(
    (profile) => profile.status === "Active" && Boolean(profile.mapsUrl),
  );
  return (
    <div className="trust-strip">
      <div className="container trust-grid">
        {showGoogleRating && hasActiveGoogleProfiles && (
          <a
            className="trust-item trust-item-rating"
            href="/reviews/"
            key="google-rating"
            aria-label={`Business-wide Google rating ${googleReviewSummary.rating.toFixed(1)} out of 5 from ${googleReviewSummary.reviewCount} reviews across all profiles`}
            title="Business-wide summary across Grade A Plumbing Google profiles"
          >
            <Icon name="star" size={27} />
            <span>
              <b>{googleReviewSummary.rating.toFixed(1)} / 5</b>
              <small>{googleReviewSummary.reviewCount} Google reviews · all profiles</small>
            </span>
          </a>
        )}
        {items.map(([icon, line1, line2], index) => {
          if (showGoogleRating && hasActiveGoogleProfiles && index === items.length - 1) return null;
          return (
            <div className="trust-item" key={line1}>
              <Icon name={icon} size={27} />
              <span>
                <b>{line1}</b>
                <small>{line2}</small>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ServiceCard({
  service,
  onClick,
}: {
  service: (typeof services)[number];
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="service-image">
        <img src={service.image} alt={`${service.title} reference`} />
      </div>
      <div className="service-card-footer">
        <span>{service.shortTitle}</span>
        <span className="round-arrow">
          <Icon name="arrow" size={13} />
        </span>
      </div>
    </>
  );
  return onClick ? (
    <button className="service-card" onClick={onClick}>
      {inner}
    </button>
  ) : (
    <a className="service-card" href={service.route}>
      {inner}
    </a>
  );
}

export function QuoteForm({ compact = false }: { compact?: boolean; defaultService?: string; defaultLocationId?: string }) {
  return <div className="quote-form existing-quote-form"><ContactForm compact={compact} /></div>;
}

export function Gallery({ preview = false }: { preview?: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const list = preview ? gallery.slice(0, 8) : gallery;
  useEffect(() => {
    if (active === null) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowLeft" && active > 0) setActive(active - 1);
      if (event.key === "ArrowRight" && active < list.length - 1)
        setActive(active + 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active, list.length]);
  return (
    <>
      <div className="gallery-grid">
        {list.map((item, index) => (
          <button
            className="gallery-card"
            key={`${item.title}-${index}`}
            onClick={() => setActive(index)}
          >
            <img
              src={item.image}
              alt={item.alt}
            />
            <span className="gallery-caption">
              <b>{item.title}</b>
              <small>{item.label}</small>
            </span>
            <span className="gallery-open">
              <Icon name="external" size={14} />
            </span>
          </button>
        ))}
      </div>
      {active !== null && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Gallery image viewer"
          onClick={() => setActive(null)}
        >
          <div
            className="lightbox-inner"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="lightbox-close"
              onClick={() => setActive(null)}
              aria-label="Close gallery"
            >
              <Icon name="close" />
            </button>
            <img src={list[active].image} alt={list[active].title} />
            <div className="lightbox-meta">
              <span>{list[active].title}</span>
              <small>{list[active].label}</small>
            </div>
            <div className="lightbox-nav">
              <button
                aria-label="Previous image"
                disabled={active === 0}
                onClick={() =>
                  setActive((active - 1 + list.length) % list.length)
                }
              >
                ←
              </button>
              <button
                aria-label="Next image"
                disabled={active === list.length - 1}
                onClick={() => setActive((active + 1) % list.length)}
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function EmergencyPanel() {
  return (
    <aside className="emergency-panel">
      <img
        src="/assets/sharp/14_Emergency_Panel_Background.jpg"
        alt="Emergency plumbing pipework"
      />
      <div className="emergency-overlay">
        <span className="eyebrow">WHEN IT CAN'T WAIT</span>
        <h2>
          Plumbing
          <br />
          emergency?<strong>We're here 24/7.</strong>
        </h2>
        <p>
          Bursts, overflows, serious leaks and blocked drains can disrupt your
          home or business. Contact our team to discuss your issue and the next
          available response.
        </p>
        <div className="emergency-actions">
          <Button href={PHONE_LINK}>Call now</Button>
          <Button href="/contact-us/" variant="dark">
            Send an enquiry
          </Button>
        </div>
      </div>
    </aside>
  );
}

export function MobileActions() {
  return (
    <nav className="mobile-actions" aria-label="Quick actions">
      <a href={PHONE_LINK}>
        <Icon name="phone" size={17} />
        Call now
      </a>
      <a href="/contact-us/">
        <Icon name="doc" size={17} />
        Free quote
      </a>
    </nav>
  );
}
