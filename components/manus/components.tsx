"use client";
import {
  FormEvent,
  ReactNode,
  useEffect,
  useId,
  useState,
  useRef,
} from "react";
import { gallery, PHONE, PHONE_LINK, services } from "./data";
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
          {nav.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>
              {label}
              {label === "Services" && <span className="nav-chevron">⌄</span>}
            </a>
          ))}
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
              <span
                className="premium-social-icon"
                role="img"
                aria-label="Facebook"
              >
                <img src={icon("facebook")} alt="" />
              </span>
              <span
                className="premium-social-icon"
                role="img"
                aria-label="Instagram"
              >
                <img src={icon("instagram")} alt="" />
              </span>
              <span
                className="premium-social-icon premium-social-google"
                role="img"
                aria-label="Google"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M21.35 12.2c0-.7-.06-1.36-.18-2H12v3.8h5.24a4.5 4.5 0 0 1-1.94 2.95v2.46h3.15c1.85-1.7 2.9-4.2 2.9-7.21ZM12 21.6c2.64 0 4.86-.88 6.48-2.39l-3.15-2.46c-.88.59-2 .94-3.33.94-2.56 0-4.73-1.73-5.51-4.06H3.23v2.53A9.8 9.8 0 0 0 12 21.6ZM6.49 13.63a5.9 5.9 0 0 1 0-3.76V7.34H3.23a9.6 9.6 0 0 0 0 8.82l3.26-2.53ZM12 5.8c1.44 0 2.73.5 3.75 1.49l2.8-2.8A9.4 9.4 0 0 0 12 1.4a9.8 9.8 0 0 0-8.77 5.94l3.26 2.53C7.27 7.53 9.44 5.8 12 5.8Z"
                  />
                </svg>
              </span>
              <span
                className="premium-social-icon"
                role="img"
                aria-label="YouTube"
              >
                <img src={icon("youtube")} alt="" />
              </span>
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

export function TrustStrip() {
  const items = [
    ["clock", "24/7", "Emergency Plumbing"],
    ["building", "Residential &", "Commercial"],
    ["pin", "Melbourne-Wide", "Service"],
    ["shield", "Quality You", "Can Trust"],
  ] as const;
  return (
    <div className="trust-strip">
      <div className="container trust-grid">
        {items.map(([icon, line1, line2]) => (
          <div className="trust-item" key={line1}>
            <Icon name={icon} size={27} />
            <span>
              <b>{line1}</b>
              <small>{line2}</small>
            </span>
          </div>
        ))}
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

export function QuoteForm({
  compact = false,
  defaultService = "",
  defaultLocationId = "",
}: {
  compact?: boolean;
  defaultService?: string;
  defaultLocationId?: string;
}) {
  const selectedService =
    services.find(
      (service) =>
        service.title === defaultService ||
        service.slug === defaultService ||
        defaultService.toLowerCase().includes(service.shortTitle.toLowerCase()),
    )?.title ?? "";
  const [status, setStatus] = useState<"idle" | "error" | "sending" | "ready">(
    "idle",
  );
  const submitting = useRef(false);
  const requestId = useRef("");
  const requestBody = useRef("");
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const pickerId = useId();
  const [selectedLocation, setSelectedLocation] =
    useState<LocationRecord | null>(null);
  useEffect(() => {
    let mounted = true;
    if (!defaultLocationId) {
      setSelectedLocation(null);
      return () => {
        mounted = false;
      };
    }
    loadLocationById(defaultLocationId)
      .then((location) => {
        if (mounted) setSelectedLocation(location ?? null);
      })
      .catch(() => {
        if (mounted) setSelectedLocation(null);
      });
    return () => {
      mounted = false;
    };
  }, [defaultLocationId]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || status === "ready") return;
    const form = event.currentTarget;
    const phone = (
      form.elements.namedItem("phone") as HTMLInputElement
    ).value.replace(/[\s()-]/g, "");
    if (!/^(?:\+?61|0)[2-478]\d{8}$/.test(phone)) {
      setStatus("error");
      setMessage("Please enter a valid Australian phone number.");
      return;
    }
    if (!selectedLocation) {
      setStatus("error");
      setMessage("Choose a listed suburb and postcode before continuing.");
      return;
    }
    const formData = new FormData(form);
    const preservedLocation = [
      "locationId",
      "suburb",
      "postcode",
      "state",
      "region",
      "lga",
    ].map((field) => formData.get(field));
    const expectedLocation = [
      selectedLocation.id,
      selectedLocation.name,
      selectedLocation.postcode,
      selectedLocation.state,
      selectedLocation.region,
      selectedLocation.lga ?? "",
    ];
    if (
      preservedLocation.some(
        (value, index) => value !== expectedLocation[index],
      )
    ) {
      setStatus("error");
      setMessage("Please select your suburb from the matching location list.");
      return;
    }
    submitting.current = true;
    setStatus("sending");
    setMessage("Sending your request…");
    try {
      const file = (
        form.querySelector('input[type="file"]') as HTMLInputElement
      )?.files?.[0];
      const attachments: {
        filename: string;
        content: string;
        contentType: string;
      }[] = [];
      if (file) {
        if (
          !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
          file.size > 2 * 1024 * 1024
        )
          throw new Error("Use a JPG, PNG or WebP photo no larger than 2 MB.");
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1]);
          reader.onerror = () =>
            reject(new Error("Could not read your photo."));
          reader.readAsDataURL(file);
        });
        attachments.push({
          filename: file.name,
          content,
          contentType: file.type,
        });
      }
      const payload = {
        name: formData.get("name"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        suburb: selectedLocation.name,
        postcode: selectedLocation.postcode,
        state: selectedLocation.state,
        locationId: selectedLocation.id,
        service: formData.get("service"),
        message: formData.get("issue"),
        preferredContact: formData.get("contact"),
        preferredDay: formData.get("day"),
        preferredDate: formData.get("date"),
        preferredTime: formData.get("time"),
        source: window.location.pathname,
        attachments,
      };
      const body = JSON.stringify(payload);
      if (requestBody.current !== body) {
        requestBody.current = body;
        requestId.current = crypto.randomUUID();
      }
      const response = await fetch("/api/quote/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, requestId: requestId.current }),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true)
        throw new Error(
          result.error ||
            "Your request was not accepted. Please call or email us.",
        );
      setStatus("ready");
      setMessage(`${result.message} Reference: ${result.referenceId}`);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not send your request. Please call or email us.",
      );
    } finally {
      submitting.current = false;
    }
  }
  return (
    <form
      className={`quote-form ${compact ? "quote-form-compact" : ""}`}
      onSubmit={submit}
    >
      {!compact && (
        <div className="form-intro">
          <span className="eyebrow">QUOTE ENQUIRY</span>
          <h2>How can we help?</h2>
          <p>
            Share a few details and we will come back to you with the next step.
          </p>
        </div>
      )}
      {compact && (
        <>
          <span className="eyebrow">FAST RESPONSE</span>
          <h2>Tell us what's going on.</h2>
          <p>Get a fast response from our plumbing team.</p>
        </>
      )}
      <div className="form-grid">
        <label>
          Full name *<input name="name" required placeholder="Your name" />
        </label>
        <label>
          Mobile number *
          <input
            name="phone"
            required
            placeholder="04XX XXX XXX"
            inputMode="tel"
          />
        </label>
        <label>
          Email
          <input name="email" type="email" placeholder="you@example.com" />
        </label>
        <div className="quote-location-field full-field">
          <label htmlFor={pickerId}>Suburb and postcode *</label>
          <LocationAutocomplete
            key={`${pickerId}-${defaultLocationId}`}
            id={pickerId}
            defaultLocationId={defaultLocationId}
            required
            placeholder="Start typing a suburb or postcode…"
            onSelect={setSelectedLocation}
          />
        </div>
        <label>
          Service required *
          <select name="service" required defaultValue={selectedService}>
            <option value="" disabled>
              Select a service
            </option>
            {services.map((service) => (
              <option key={service.slug}>{service.title}</option>
            ))}
          </select>
        </label>
        <label className="full-field">
          Description of issue *
          <textarea
            name="issue"
            required
            placeholder="Tell us what's happening..."
            rows={compact ? 3 : 4}
          />
        </label>
      </div>
      <fieldset>
        <legend>Preferred contact method</legend>
        <div className="choice-row">
          <label>
            <input type="radio" name="contact" defaultChecked value="phone" />
            Phone
          </label>
          <label>
            <input type="radio" name="contact" value="email" />
            Email
          </label>
          <label>
            <input type="radio" name="contact" value="sms" />
            SMS
          </label>
        </div>
      </fieldset>
      <div className="form-grid">
        <label>
          Preferred appointment day
          <select name="day" defaultValue="">
            <option value="">Select a day</option>
            <option>Today</option>
            <option>Tomorrow</option>
            <option>This week</option>
            <option>Next week</option>
          </select>
        </label>
        <label>
          Preferred time
          <select name="time" defaultValue="">
            <option value="">Select a time</option>
            <option>Morning</option>
            <option>Afternoon</option>
            <option>Evening</option>
          </select>
        </label>
      </div>
      <label>
        Preferred date (optional)
        <input type="date" name="date" />
      </label>
      <label className="upload-field">
        <span>
          Upload a photo <small>(optional)</small>
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => setFileName(event.target.files?.[0]?.name || "")}
        />
        <span className="upload-placeholder">
          <Icon name="upload" size={20} />
          {fileName || "Click to upload"}
          <small>JPG, PNG or WebP (max. 2 MB)</small>
        </span>
      </label>
      <Button
        type="submit"
        className="form-submit"
        disabled={status === "sending" || status === "ready"}
      >
        {status === "sending"
          ? "Sending…"
          : status === "ready"
            ? "Request received"
            : "Request my free quote"}
      </Button>
      {status !== "idle" && (
        <p
          className={`form-status ${status === "error" ? "form-error" : "form-success"}`}
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      )}
      <p className="form-note">
        Appointment preferences are requests, not confirmed bookings. For urgent
        assistance, call us.
      </p>
    </form>
  );
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
              alt={`${item.title} ${item.label.toLowerCase()}`}
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
