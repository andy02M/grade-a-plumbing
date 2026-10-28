"use client";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import Image from "next/image";
import { publicPageHref } from "./routes";
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
import { googleReviewSummary } from "@/lib/google-review-summary";
import homepageData from "@/data/homepage-review-summary.json";
import performanceAssets from "@/data/performance-assets.json";
import { LocationAutocomplete } from "./LocationFeatures";
import {
  loadLocationById,
  loadLocationCatalogue,
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

const iconPaths: Record<IconName, ReactNode> = {
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
  return <svg {...common}>{iconPaths[name]}</svg>;
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
    <a className={classes} href={publicPageHref(href)}>
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
      <picture style={{display:"contents"}}>
      <source type="image/webp" srcSet={performanceAssets.headerLogoSrcSet} sizes="(max-width: 768px) 106px, 126px" />
      <Image
        src={performanceAssets.headerLogo}
        unoptimized
        alt="Grade A Plumbing"
        width={1369}
        height={542}
        sizes="(max-width: 768px) 146px, 184px"
        loading="eager"
      />
      </picture>
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
            <a key={href} href={publicPageHref(href)} className={active ? "nav-link-active" : undefined} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>
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
  const footerRef = useRef<HTMLElement>(null);
  const [nearFooter, setNearFooter] = useState(false);
  useEffect(() => {
    if (!footerRef.current) return;
    if (!("IntersectionObserver" in window)) { setNearFooter(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setNearFooter(true); observer.disconnect(); }
    }, {rootMargin:"1000px"});
    observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);
  const serviceColumns = [services.slice(0, 6), services.slice(6, 12)];
  const explore = [
    ["Home", "/"],
    ["Our Work", "/our-work/"],
    ["Service Areas", "/service-areas/"],
    ["About", "/about-us/"],
    ["Reviews", "/reviews/"],
    ["Contact", "/contact-us/"],
    ["Payment information", "/payment/"],
  ];
  const icon = (name: string) => `/assets/footer/icons/${name}.svg`;
  return (
    <footer
      ref={footerRef}
      className="site-footer premium-footer"
      aria-label="Grade A Plumbing footer"
    >
      <div className="premium-footer-bg" style={nearFooter ? undefined : {backgroundImage:"none"}} aria-hidden="true" />
      <div className="container premium-footer-inner">
        <div className="premium-footer-columns">
          <section className="premium-footer-brand">
            <a
              className="premium-footer-logo"
              href="/"
              aria-label="Grade A Plumbing home"
            >
              <ResponsiveImage
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
                <ResponsiveImage src={icon("facebook")} alt="" />
              </a>
              <a
                className="premium-social-icon"
                href="https://www.facebook.com/profile.php?id=61589874502109"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Grade A Plumbing Facebook profile"
              >
                <ResponsiveImage src={icon("facebook")} alt="" />
              </a>
              <a
                className="premium-social-icon"
                href="https://www.instagram.com/gradea.plumbing/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Grade A Plumbing on Instagram"
              >
                <ResponsiveImage src={icon("instagram")} alt="" />
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
                    <a key={service.slug} href={publicPageHref(service.route)}>
                      {service.title}
                      <ResponsiveImage src={icon("chevron-right")} alt="" />
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
                  <a key={href} href={publicPageHref(href)}>
                  {label}
                  <ResponsiveImage src={icon("chevron-right")} alt="" />
                </a>
              ))}
            </div>
          </nav>
          <section className="premium-footer-contact">
            <h2>Get in touch</h2>
            <a className="premium-contact-row" href="tel:+61258375457">
              <ResponsiveImage src={icon("phone")} alt="" />
              <span>
                <b>(02) 5837 5457</b>
                <small>Available 24/7 for emergencies</small>
              </span>
            </a>
            <a
              className="premium-contact-row"
              href="mailto:support@gradeaplumbing.store"
            >
              <ResponsiveImage src={icon("mail")} alt="" />
              <span>
                <b>support@gradeaplumbing.store</b>
                <small>We'll respond as soon as possible</small>
              </span>
            </a>
            <div className="premium-contact-row">
              <ResponsiveImage src={icon("map-pin")} alt="" />
              <span>
                <b>Melbourne, VIC</b>
                <small>Serving Melbourne and surrounding suburbs</small>
              </span>
            </div>
          </section>
        </div>
        <div className="premium-trust-bar">
          <div>
            <ResponsiveImage src={icon("clock")} alt="" />
            <span>
              <b>24/7</b>
              <small>Emergency Plumbing</small>
            </span>
          </div>
          <div>
            <ResponsiveImage src={icon("building")} alt="" />
            <span>
              <b>Residential &amp;</b>
              <small>Commercial</small>
            </span>
          </div>
          <div>
            <ResponsiveImage src={icon("map-pin")} alt="" />
            <span>
              <b>Melbourne-Wide</b>
              <small>Service</small>
            </span>
          </div>
          <div>
            <ResponsiveImage src={icon("shield-check")} alt="" />
            <span>
              <b>Quality You</b>
              <small>Can Trust</small>
            </span>
          </div>
        </div>
      </div>
      <p className="container relative py-3 text-sm leading-relaxed">
        After-hours attendance applies from 4 pm, subject to availability. Any additional charges are confirmed and accepted before dispatch.
      </p>
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
  const hasActiveGoogleProfiles = homepageData.hasActiveGoogleProfiles;
  return (
    <div className="trust-strip">
      <div className="container trust-grid">
        {showGoogleRating && hasActiveGoogleProfiles && (
          <a
            className="trust-item trust-item-rating"
            href={publicPageHref('/reviews/')}
            key="google-rating"
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
        <picture style={{display:"contents"}}>
          <source type="image/avif" srcSet={(performanceAssets.serviceImages as Record<string,string>)[service.image]} sizes="(max-width: 720px) calc(50vw - 24px), (max-width: 900px) 30vw, (max-width:1100px) calc((94vw - 368px) / 3), (max-width:1399px) 184px, 180px" />
          <ResponsiveImage src={service.image} alt={`${service.title} reference`} sizes="(max-width: 720px) calc(50vw - 24px), (max-width: 900px) 30vw, (max-width:1100px) calc((94vw - 368px) / 3), (max-width:1399px) 184px, 180px" />
        </picture>
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
    <a className="service-card" href={publicPageHref(service.route)}>
      {inner}
    </a>
  );
}

export function QuoteForm({ compact = false, defaultService = '', defaultLocationId = '' }: { compact?: boolean; defaultService?: string; defaultLocationId?: string }) {
  const [suburb,setSuburb] = useState('');
  const [service,setService] = useState(defaultService);
  useEffect(() => {
    let cancelled=false;
    const requested=defaultLocationId || new URLSearchParams(window.location.search).get('location');
    const resolve = requested ? loadLocationById(requested) : loadLocationCatalogue().then(catalogue=>{
      const host=window.location.hostname;
      const slug=host.endsWith('.gradeaplumbing.store')?host.split('.')[0]:'';
      return catalogue.locations.find(location=>location.website && new URL(location.website).hostname===host)
        ?? catalogue.locations.find(location=>slug && location.name.toLowerCase().replace(/[^a-z0-9]/g,'')===slug);
    });
    resolve.then(location=>{if(!cancelled)setSuburb(location ? `${location.name} ${location.state} ${location.postcode}` : '');}).catch(()=>{if(!cancelled)setSuburb('');});
    setService(defaultService || window.location.pathname);
    return ()=>{cancelled=true;};
  },[defaultLocationId,defaultService]);
  return <div className="quote-form existing-quote-form"><ContactForm compact={compact} defaultSuburb={suburb} defaultService={service} /></div>;
}

export function Gallery({ preview = false }: { preview?: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  useEffect(() => {
    if (!grid.current) return;
    if (!("IntersectionObserver" in window)) { setNearViewport(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setNearViewport(true); observer.disconnect(); }
    }, { rootMargin: "400px" });
    observer.observe(grid.current);
    return () => observer.disconnect();
  }, []);
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
      <div className="gallery-grid" ref={grid}>
        {list.map((item, index) => (
          <button
            className="gallery-card"
            key={`${item.title}-${index}`}
            onClick={() => setActive(index)}
          >
            <picture style={{display:"contents"}}>
            <source type="image/avif" srcSet={(performanceAssets.galleryImages as Record<string,string>)[item.image]} sizes="(max-width: 768px) 46vw, 280px" />
            <ResponsiveImage
              src={item.image}
              alt={item.alt}
              sizes="(max-width: 768px) 46vw, 280px"
              loading={nearViewport ? "eager" : "lazy"}
            />
            </picture>
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
            <ResponsiveImage loading="eager" sizes="90vw" src={list[active].image} alt={list[active].title} />
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
      <picture style={{display:"contents"}}>
      <source type="image/avif" srcSet={performanceAssets.serviceImages["/assets/sharp/05_Burst_Pipe_Repairs.jpg"]} sizes="(max-width:720px) calc(100vw - 32px), 500px" />
      <ResponsiveImage
        src="/assets/sharp/14_Emergency_Panel_Background.jpg"
        alt="Emergency plumbing pipework"
        sizes="(max-width:720px) calc(100vw - 32px), 500px"
      />
      </picture>
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
