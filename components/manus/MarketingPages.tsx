"use client";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import "./pages.css";
import {
  Button,
  Icon,
  QuoteForm,
  SectionHeading,
  TrustStrip,
} from "./components";
import { customerReviews } from "@/lib/customer-reviews";
import { EMAIL, PHONE, PHONE_LINK } from "./data";
import {
  Gallery,
  serviceDetails,
  serviceList,
  type PageCard,
  type PageFAQ,
  type ServiceDetail,
} from "./marketingData";
import { LocationDirectory } from "./LocationFeatures";
import { normalizePageRoute, publicPageHref } from "./routes";
import {
  Breadcrumbs,
  ContentSections,
  OnThisPage,
  PricingSection,
  RelatedServices,
  SourceNotes,
} from "./ServiceSections";
import { BUSINESS_NAME, OG_IMAGE, getRouteMeta } from "./routeMeta";
import { serviceSeoFor } from "./seoContent";

export { isMarketingRoute, normalizePageRoute } from "./routes";

function PageImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`page-image ${className}`}>
      <Image src={src} alt={alt} width={960} height={640} sizes="(max-width: 768px) 100vw, 33vw" />
      <span className="image-disclosure">concept</span>
    </div>
  );
}

function PageHero({
  eyebrow,
  lead,
  highlight,
  description,
  image,
  imageAlt,
  primaryHref = "#service-quote",
  primaryLabel = "Request a free quote",
  secondaryLabel = `Call ${PHONE}`,
  secondaryHref = PHONE_LINK,
}: {
  eyebrow: string;
  lead: string;
  highlight?: string;
  description: string;
  image: string;
  imageAlt: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="interior-hero">
      <Image
        className="interior-hero-image"
        src={image}
        alt={imageAlt}
        fill priority sizes="100vw"
      />
      <div className="interior-hero-shade" />
      <div className="container interior-hero-inner">
        <span className="eyebrow">{eyebrow}</span>
        <h1>
          {lead}
          {highlight && (
            <>
              <br />
              <strong>{highlight}</strong>
            </>
          )}
        </h1>
        <p>{description}</p>
        <div className="hero-actions">
          <Button href={secondaryHref}>{secondaryLabel}</Button>
          <Button href={primaryHref} variant="dark">
            {primaryLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}

function PageServiceCard({
  item,
  linkFallback = "#service-quote",
}: {
  item: PageCard;
  linkFallback?: string;
}) {
  const content = (
    <>
      {item.image ? (
        <PageImage
          src={item.image}
          alt={`${item.title} — plumbing concept`}
        />
      ) : (
        <div className="page-card-icon">
          <Icon name="check" size={25} />
        </div>
      )}
      <span className="page-service-card-copy">
        <b>{item.title}</b>
        <span>{item.body}</span>
      </span>
      <span className="page-card-arrow" aria-hidden="true">
        <Icon name="arrow" size={15} />
      </span>
    </>
  );
  return (
    <a className="page-service-card" href={publicPageHref(item.route || linkFallback)}>
      {content}
    </a>
  );
}

function PageCardGrid({
  cards,
  columns = 3,
}: {
  cards: PageCard[];
  columns?: 2 | 3 | 4;
}) {
  return (
    <div className={`page-card-grid page-card-grid-${columns}`}>
      {cards.map((item, index) => (
        <PageServiceCard key={`${item.title}-${index}`} item={item} />
      ))}
    </div>
  );
}

function FeatureSplit({
  title,
  body,
  image,
  imageAlt,
  benefits,
  dark = false,
  label = "THE GRADE A APPROACH",
}: {
  title: string;
  body: string;
  image: string;
  imageAlt: string;
  benefits: string[];
  dark?: boolean;
  label?: string;
}) {
  const icons = [
    "check",
    "shield",
    "chat",
    "doc",
    "building",
    "clock",
  ] as const;
  return (
    <section className={`page-feature ${dark ? "page-feature-dark" : ""}`}>
      <div className="page-feature-image">
        <img src={image} alt={imageAlt} loading="lazy" />
        <span className="image-disclosure">concept</span>
      </div>
      <div className="page-feature-copy">
        <span className="eyebrow">{label}</span>
        <h2>{title}</h2>
        <p>{body}</p>
        <div className="page-benefits">
          {benefits.map((benefit, index) => (
            <div className="page-benefit" key={benefit}>
              <Icon name={icons[index % icons.length]} size={21} />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessSteps({
  steps,
  title = "A clear process, from first call to next step.",
}: {
  steps: string[];
  title?: string;
}) {
  const icons = ["phone", "doc", "chat", "check"] as const;
  return (
    <section className="page-process-section">
      <div className="container">
        <SectionHeading eyebrow="HOW IT WORKS" title={title} />
        <ol className="page-process">
          {steps.map((step, index) => (
            <li key={`${index}-${step}`}>
              <span className="page-process-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="page-process-mark">
                <Icon name={icons[index % icons.length]} size={23} />
              </span>
              <b>{step}</b>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FAQAccordion({ items }: { items: PageFAQ[] }) {
  return (
    <div className="page-faq-list">
      {items.map((item, index) => (
        <details className="page-faq-item" key={`${index}-${item.question}`}>
          <summary>
            <span>{item.question}</span>
            <span className="faq-toggle" aria-hidden="true">
              +
            </span>
          </summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

function QuoteAside({
  title = "Request a free quote",
  formId = "service-quote",
  defaultService = "",
  defaultLocationId = "",
}: {
  title?: string;
  formId?: string;
  defaultService?: string;
  defaultLocationId?: string;
}) {
  return (
    <aside className="page-quote-panel" id={formId}>
      <div className="page-quote-heading">
        <span className="eyebrow">QUOTE ENQUIRY</span>
        <h2>{title}</h2>
        <p>
          Share the details and your suburb. For urgent problems, call first.
        </p>
      </div>
      <QuoteForm
        compact
        defaultService={defaultService}
        defaultLocationId={defaultLocationId}
      />
      <p className="form-integration-note">
        Your request is sent only when the submission is accepted. For urgent
        assistance, call us.
      </p>
    </aside>
  );
}

function ServiceLanding({
  detail,
  slug,
  route,
  locationName,
}: {
  detail: ServiceDetail;
  slug: string;
  route: string;
  locationName: string;
}) {
  const formPlacement = slug === "emergency-plumbing" ? "top" : "faq";
  const isEmergency = slug === "emergency-plumbing";
  const isHotWater = slug === "hot-water-systems";
  const isBurst = slug === "burst-pipe-repairs";
  const isBlocked = slug === "blocked-drains";
  const introCards = detail.cards;
  const seo = serviceSeoFor(slug);
  const routeMeta = getRouteMeta(route);
  const sections = seo?.sections ?? [];
  const splitAt = Math.ceil(sections.length / 2);
  const firstHalf = sections.slice(0, splitAt);
  const secondHalf = sections.slice(splitAt);
  const faqs = seo && seo.faqs.length ? seo.faqs : detail.faqs;
  return (
    <div className="marketing-page" data-page={slug}>
      <PageHero
        eyebrow={(seo?.heroEyebrow ?? detail.eyebrow).replace(/Melbourne/gi, locationName)}
        lead={locationName === "Melbourne" ? (seo?.heroLead ?? detail.lead) : detail.title}
        highlight={locationName === "Melbourne" ? (seo?.heroHighlight ?? detail.highlight) : locationName}
        description={(seo?.heroDescription ?? detail.description).replace(/\bMelbourne\b/g, locationName)}
        image={detail.image}
        imageAlt={detail.imageAlt}
      />
      <TrustStrip />
      <Breadcrumbs items={routeMeta.breadcrumbs} />
      <OnThisPage sections={sections} />
      <section className="page-service-overview">
        <div
          className={`container page-service-grid ${formPlacement === "faq" ? "page-service-grid-wide" : ""}`}
        >
          <div className="page-service-main">
            <SectionHeading
              eyebrow={
                isEmergency
                  ? "COMMON URGENT PLUMBING ISSUES"
                  : isBlocked
                    ? "DRAIN SERVICES"
                    : isHotWater
                      ? "HOT WATER SERVICES"
                      : isBurst
                        ? "WHAT TO CHECK"
                        : "HOW WE CAN HELP"
              }
              title={detail.introTitle}
              body={detail.introBody}
            />
            <PageCardGrid cards={introCards} columns={3} />
            {isBurst && (
              <div className="page-safety-note">
                <Icon name="shield" size={22} />
                <p>
                  <b>Safety first:</b> If it is safe, isolate the water supply.
                  Stay clear of water near electrical equipment. If the area is
                  unsafe, move away and call emergency services if anyone is in
                  immediate danger.
                </p>
              </div>
            )}
          </div>
          {formPlacement === "top" && (
            <QuoteAside defaultService={detail.title} />
          )}
        </div>
      </section>
      {seo && (
        <section className="page-longform">
          <div className="container page-longform-inner">
            <ContentSections intro={seo.intro} sections={firstHalf} first />
          </div>
        </section>
      )}
      {detail.systemTypes && (
        <section className="page-systems-section">
          <div className="container">
            <SectionHeading
              eyebrow="COMMON HOT-WATER CONCERNS"
              title="Different symptoms need different advice."
              body="The unit, condition and site affect service options. Share the details you know when you enquire."
            />
            <div className="page-system-grid">
              {detail.systemTypes.map((item, index) => (
                <article className="page-system-card" key={item.title}>
                  <span className="page-system-number">0{index + 1}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
      {detail.featureTitle && (
        <FeatureSplit
          title={detail.featureTitle}
          body={detail.featureBody}
          image={detail.featureImage}
          imageAlt={detail.featureAlt}
          benefits={detail.benefits}
          dark={isEmergency}
          label={
            isEmergency
              ? "WHY CHOOSE GRADE A PLUMBING?"
              : isBlocked
                ? "OUR BLOCKED DRAIN SOLUTIONS"
                : isBurst
                  ? "FIRST RESPONSE, CAREFULLY"
                  : "THE GRADE A APPROACH"
          }
        />
      )}
      <ProcessSteps
        steps={detail.process}
        title={
          isEmergency
            ? "Our emergency plumbing process."
            : isBurst
              ? "A careful repair process."
              : "Plumbing help without the guesswork."
        }
      />
      {seo && secondHalf.length > 0 && (
        <section className="page-longform page-longform-continued">
          <div className="container page-longform-inner">
            <ContentSections sections={secondHalf} />
          </div>
        </section>
      )}
      {seo && <PricingSection factors={seo.pricingFactors} />}
      {isEmergency && (
        <section className="page-emergency-reference">
          <div className="container">
            <SectionHeading
              eyebrow="SERVICE IMAGE REFERENCES"
              title="Examples of plumbing issues."
              body="These supplied visuals show common plumbing issues."
            />
            <div className="page-mini-gallery">
              {Gallery.slice(0, 3).map((item) => (
                <div className="page-mini-reference" key={item.title}>
                  <PageImage
                    src={item.image || ""}
                    alt={`${item.title}`}
                  />
                  <b>{item.title}</b>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      <section className="page-faq-section">
        <div
          className={`container page-faq-layout ${isEmergency ? "page-faq-layout-single" : ""}`}
        >
          <div>
            <SectionHeading
              eyebrow="FREQUENTLY ASKED QUESTIONS"
              title="Good questions. Clear answers."
              body="If your situation is urgent, call first to discuss availability and the safest next step."
            />
            <FAQAccordion items={faqs} />
          </div>
          {formPlacement === "faq" && (
            <QuoteAside defaultService={detail.title} />
          )}
        </div>
      </section>
      {seo && <RelatedServices items={seo.relatedServices} />}
      {seo && <SourceNotes sources={seo.sources} />}
      <EmergencyCTA />
      <PageAreaCallout />
    </div>
  );
}

function EmergencyCTA({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={`page-emergency-cta ${compact ? "page-emergency-cta-compact" : ""}`}
    >
      {!compact && (
        <img
          src="/assets/grade-a/emergency-plumber-working.webp"
          alt="Emergency plumbing"
          loading="lazy"
        />
      )}
      <div className="page-emergency-shade" />
      <div className="page-emergency-copy">
        <span className="eyebrow">WHEN IT CAN'T WAIT</span>
        <h2>
          Plumbing emergency?
          <br />
          <strong>Call to discuss the next step.</strong>
        </h2>
        <p>
          Current availability depends on location and bookings. For immediate
          danger, contact emergency services.
        </p>
        <div className="hero-actions">
          <Button href={PHONE_LINK}>Call {PHONE}</Button>
          <Button href="/contact/" variant="dark">
            Send an enquiry
          </Button>
        </div>
      </div>
    </section>
  );
}

function PageAreaCallout() {
  return (
    <section className="page-area-callout">
      <div className="container page-area-callout-inner">
        <div>
          <span className="eyebrow">MELBOURNE SERVICE AREA</span>
          <h2>Local plumbing help across Melbourne.</h2>
          <p>
            Browse listed suburbs and contact us to confirm current
            availability.
          </p>
        </div>
        <Button href="/service-areas/" variant="outline">
          Explore service areas
        </Button>
      </div>
    </section>
  );
}

function ServicesOverview({ locationName }: { locationName: string }) {
  return (
    <div className="marketing-page" data-page="services">
      <PageHero
        eyebrow="GRADE A PLUMBING SERVICES"
        lead="Our Plumbing Services"
        highlight={locationName}
        description={`From everyday plumbing issues to urgent repairs, explore service enquiries in ${locationName}. Confirm availability and the assessment required for your property.`}
        image="/assets/grade-a/hero-plumber-under-sink.webp"
        imageAlt="Plumber at work"
        primaryHref="/contact/"
      />
      <TrustStrip />
      <section className="page-services-catalog">
        <div className="container">
          <SectionHeading
            eyebrow="PLUMBING HELP FOR EVERY PROPERTY"
            title="Find the service you need."
            body="Choose a service to learn about common issues, assessment and next steps. If you are not sure which page fits, call us and describe the problem."
          />
          <div className="page-catalog-grid">
            {serviceList.map((service) => (
              <PageServiceCard
                key={service.slug}
                item={{
                  title: service.title,
                  body: service.description,
                  image: service.image,
                  route: service.route,
                }}
                linkFallback={service.route}
              />
            ))}
          </div>
        </div>
      </section>
      <EmergencyCTA />
      <PageAreaCallout />
    </div>
  );
}

function GalleryLightbox({
  items,
  active,
  close,
  move,
}: {
  items: readonly PageCard[];
  active: number | null;
  close: () => void;
  move: (step: number) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (active === null) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close, move]);
  if (active === null) return null;
  const item = items[active];
  return (
    <div
      className="page-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Completed project photo viewer"
      onClick={close}
    >
      <div
        className="page-lightbox-inner"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          className="page-lightbox-close"
          onClick={close}
          aria-label="Close image viewer"
        >
          ×
        </button>
        <img src={item.image} alt={item.body} />
        <div className="page-lightbox-caption">
          <b>{item.title}</b>
          <span>{item.body}</span>
        </div>
        <div className="page-lightbox-controls">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous image"
          >
            Previous
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Next image">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function OurWorkPage() {
  const [filter, setFilter] = useState("All projects");
  const [active, setActive] = useState<number | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const categories = useMemo(
    () => [
      "All projects",
      ...Array.from(new Set(Gallery.map((item) => item.category))),
    ],
    [],
  );
  const items = useMemo(
    () =>
      filter === "All projects"
        ? Gallery
        : Gallery.filter((item) => item.category === filter),
    [filter],
  );
  const close = () => {
    setActive(null);
    opener.current?.focus();
  };
  const move = (step: number) =>
    setActive((index) =>
      index === null ? null : (index + step + items.length) % items.length,
    );
  return (
    <div className="marketing-page" data-page="our-work">
      <PageHero
        eyebrow="OUR WORK · COMPLETED PROJECTS"
        lead="Plumbing Projects"
        highlight="& Recent Work"
        description="Browse completed Grade A Plumbing projects across bathrooms, kitchens, hot water, drainage and pipework."
        image="/assets/project-photos/drainage-trench.webp"
        imageAlt="Drainage trench from a Grade A Plumbing project"
        primaryHref="#project-gallery"
        primaryLabel="Explore the projects"
        secondaryLabel="Contact Grade A"
        secondaryHref="/contact/"
      />
      <section id="project-gallery" className="page-work-section">
        <div className="container">
          <SectionHeading
            eyebrow="COMPLETED PROJECT PHOTOS"
            title="Recent plumbing work."
            body="Photos from Grade A Plumbing projects, including bathroom fixtures, kitchen plumbing, hot-water systems, drainage and pipework."
          />
          <div
            className="page-gallery-filters"
            role="group"
            aria-label="Filter project photo categories"
          >
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={filter === category ? "selected" : ""}
                aria-pressed={filter === category}
                onClick={() => {
                  setFilter(category);
                  setActive(null);
                }}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="page-reference-gallery">
            {items.map((item, index) => (
              <button
                type="button"
                className="page-reference-card"
                key={item.title}
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  setActive(index);
                }}
              >
                <img
                  src={item.image}
                  alt={item.body}
                  loading="lazy"
                />
                <span className="page-reference-meta">
                  <b>{item.title}</b>
                  <small>{item.category} · Completed project</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
      <GalleryLightbox
        items={items}
        active={active}
        close={close}
        move={move}
      />
      <PageAreaCallout />
    </div>
  );
}

function AboutPage() {
  const values = [
    [
      "chat",
      "Clear communication",
      "Understand the issue and the proposed next step.",
    ],
    [
      "shield",
      "Careful and respectful",
      "Take the property and access requirements into account.",
    ],
    [
      "building",
      "Residential and commercial",
      "Enquiries for homes, businesses and managed properties.",
    ],
    [
      "check",
      "Quality-minded",
      "Discuss the scope and price before agreed work proceeds.",
    ],
  ] as const;
  const difference = [
    "Clear communication",
    "Practical advice",
    "Respect for your property",
    "Scope discussed in advance",
    "Residential and commercial enquiries",
    "Follow-up explanation of agreed work",
  ];
  return (
    <div className="marketing-page" data-page="about">
      <PageHero
        eyebrow="ABOUT GRADE A PLUMBING"
        lead="A Local Plumbing Team"
        highlight="You Can Trust"
        description="Grade A Plumbing provides plumbing service enquiries across Melbourne. Clear communication, respectful work and a practical next step guide how we approach each conversation."
        image="/assets/grade-a/team-brand-concept.webp"
        imageAlt="Team and service van"
        primaryHref="/contact/"
        primaryLabel="Get in touch"
        secondaryLabel={`Call ${PHONE}`}
      />
      <section className="page-values-strip">
        <div className="container page-values-grid">
          {values.map(([icon, title, body]) => (
            <div className="page-value" key={title}>
              <Icon name={icon} size={27} />
              <b>{title}</b>
              <span>{body}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="page-story-section">
        <div className="container page-story-grid">
          <div>
            <span className="eyebrow">OUR APPROACH</span>
            <h2>Built on quality, service and trust.</h2>
            <p>
              Grade A Plumbing is a Melbourne plumbing service for homes,
              businesses and managed properties. We focus on listening to the
              problem, explaining what can be assessed and making the proposed
              scope clear before agreed work proceeds.
            </p>
            <p>
              We do not publish unverified staff biographies, years of
              experience or credentials on this preview. The images on this page
              are shown here as service imagery for the Grade A Plumbing team.
            </p>
            <Button href="/services/" variant="outline">
              Explore our services
            </Button>
          </div>
          <PageImage
            src="/assets/grade-a/hot-water-service.webp"
            alt="plumber working beside a hot-water system; not a verified Grade A Plumbing staff photo"
          />
        </div>
      </section>
      <FeatureSplit
        title="A Grade A difference, in the details."
        body="Good service is built through practical choices at every stage: clear communication, careful work and a straightforward explanation of what happens next."
        image="/assets/grade-a/kitchen-plumbing.webp"
        imageAlt="Kitchen plumbing image"
        benefits={difference}
        label="THE GRADE A DIFFERENCE"
      />
      <section className="page-bottom-cta">
        <div className="container page-bottom-cta-inner">
          <div>
            <span className="eyebrow">NEED PLUMBING HELP?</span>
            <h2>Tell us what is happening.</h2>
            <p>
              For an urgent issue, call first to discuss current availability.
            </p>
          </div>
          <div className="hero-actions">
            <Button href={PHONE_LINK}>Call {PHONE}</Button>
            <Button href="/contact/" variant="dark">
              Contact Grade A
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ServiceAreaPage() {
  return (
    <div className="marketing-page" data-page="service-areas">
      <PageHero
        eyebrow="GRADE A PLUMBING · LOCATION DIRECTORY"
        lead="Plumbing Services"
        highlight="Melbourne & Sydney"
        description="Browse the official Greater Melbourne locality list and the three Sydney locations specified by the business. Coverage is shown separately from geographic inclusion."
        image="/assets/grade-a/melbourne-skyline-concept.webp"
        imageAlt="Melbourne skyline image"
        primaryHref="#area-browser"
        primaryLabel="Find your suburb"
        secondaryLabel={`Call ${PHONE}`}
      />
      <section id="area-browser" className="page-regions-section">
        <div className="container">
          <LocationDirectory />
        </div>
      </section>
      <section className="page-bottom-cta">
        <div className="container page-bottom-cta-inner">
          <div>
            <span className="eyebrow">CHECK YOUR SUBURB</span>
            <h2>Not sure if we cover your location?</h2>
            <p>Call or email with your suburb and the service you need.</p>
          </div>
          <div className="hero-actions">
            <Button href={PHONE_LINK}>Call {PHONE}</Button>
            <Button href="/contact/" variant="dark">
              Send an enquiry
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactPage() {
  const [requestedLocationId, setRequestedLocationId] = useState("");
  useEffect(() => {
    const value =
      new URLSearchParams(window.location.search).get("location") ?? "";
    if (/^[a-z0-9-]+$/i.test(value)) setRequestedLocationId(value);
  }, []);
  const defaultLocationId = requestedLocationId;
  return (
    <div className="marketing-page" data-page="contact">
      <PageHero
        eyebrow="CONTACT GRADE A PLUMBING"
        lead="Get in Touch"
        description="Tell us what you need, your suburb and the best way to reach you. For urgent issues, call to discuss current availability."
        image="/assets/grade-a/plumber-at-door.webp"
        imageAlt="Plumbing service visit"
        primaryHref="#contact-form"
        primaryLabel="Send an enquiry"
        secondaryLabel={`Call ${PHONE}`}
      />
      <TrustStrip />
      <section className="page-contact-section">
        <div className="container page-contact-grid">
          <div>
            <SectionHeading
              eyebrow="OTHER WAYS TO CONTACT"
              title="Talk to the plumbing team."
              body="Phone and email are the available direct contact methods on this preview. No street address or physical office is represented."
            />
            <div className="page-contact-methods">
              <a href={PHONE_LINK}>
                <span>
                  <Icon name="phone" size={22} />
                </span>
                <div>
                  <b>Call the team</b>
                  <strong>{PHONE}</strong>
                  <small>
                    For urgent problems, call to discuss the next step.
                  </small>
                </div>
              </a>
              <a href={`mailto:${EMAIL}`}>
                <span>
                  <Icon name="doc" size={22} />
                </span>
                <div>
                  <b>Email an enquiry</b>
                  <strong>{EMAIL}</strong>
                  <small>Include your suburb and a short description.</small>
                </div>
              </a>
              <div className="page-contact-service-area">
                <span>
                  <Icon name="pin" size={22} />
                </span>
                <div>
                  <b>Service area</b>
                  <strong>Melbourne and selected Sydney locations</strong>
                  <small>
                    Contact us to confirm current coverage for your suburb.
                  </small>
                </div>
              </div>
            </div>
            <PageImage
              src="/assets/grade-a/emergency-plumber-working.webp"
              alt="Plumbing service work"
              className="page-contact-image"
            />
          </div>
          <div id="contact-form">
            <QuoteAside
              title="Send us a message"
              formId="contact-quote"
              defaultLocationId={defaultLocationId}
            />
          </div>
        </div>
      </section>
      <PageAreaCallout />
    </div>
  );
}

function ReviewsPage() {
  return (
    <div className="marketing-page" data-page="reviews">
      <PageHero
        eyebrow="GRADE A PLUMBING · REVIEWS"
        lead="Customer Feedback"
        highlight="Matters"
        description="Five-star feedback shared by our customers."
        image="/assets/grade-a/melbourne-community-concept.webp"
        imageAlt="Melbourne service area"
        primaryHref="/contact/"
        primaryLabel="Contact Grade A"
        secondaryLabel={`Call ${PHONE}`}
        secondaryHref={PHONE_LINK}
      />
      <section className="section reviews-section">
        <div className="container">
          <div className="review-grid">
            {customerReviews
              .map((r, index) => (
                <article className="review-card" key={r.name+'-'+index}>
                  <div className="review-source-rating" aria-label="5 out of 5 stars">
                    <span className="review-stars" aria-hidden="true">★★★★★</span>
                  </div>
                  {r.text ? <p className="whitespace-pre-line">{r.text}</p> : null}
                  <footer>
                    <b>{r.name}</b>
                  </footer>
                </article>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function upsertMeta(
  attribute: "name" | "property",
  key: string,
  content: string,
) {
  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function PageMeta({ path }: { path: string }) {
  useEffect(() => {
    const meta = getRouteMeta(path);
    document.title = meta.title;
    upsertMeta("name", "description", meta.description);
    upsertMeta("name", "robots", meta.robots);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", BUSINESS_NAME);
    upsertMeta("property", "og:title", meta.title);
    upsertMeta("property", "og:description", meta.description);
    upsertMeta("property", "og:url", meta.canonical);
    upsertMeta("property", "og:image", OG_IMAGE);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", meta.title);
    upsertMeta("name", "twitter:description", meta.description);
    upsertMeta("name", "twitter:image", OG_IMAGE);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", meta.canonical);
    for (const node of Array.from(
      document.querySelectorAll("script[data-route-jsonld]"),
    ))
      node.remove();
    for (const node of meta.jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-route-jsonld", "");
      script.textContent = JSON.stringify(node);
      document.head.appendChild(script);
    }
  }, [path]);
  return null;
}

export default function MarketingPage({ path, locationName = "Melbourne" }: { path: string; locationName?: string }) {
  const canonical = normalizePageRoute(path);
  const detail = serviceList.find((item) => item.route === canonical);
  const detailConfig = detail ? serviceDetails[detail.slug] : undefined;
  let page: ReactNode;
  if (canonical === "/services/") page = <ServicesOverview locationName={locationName} />;
  else if (canonical === "/our-work/") page = <OurWorkPage />;
  else if (canonical === "/about/") page = <AboutPage />;
  else if (canonical === "/service-areas/") page = <ServiceAreaPage />;
  else if (canonical === "/contact/") page = <ContactPage />;
  else if (canonical === "/reviews/") page = <ReviewsPage />;
  else if (detailConfig && detail)
    page = (
      <ServiceLanding
        key={canonical}
        detail={detailConfig}
        slug={detail.slug}
        route={canonical}
        locationName={locationName}
      />
    );
  else page = <ServicesOverview locationName={locationName} />;
  return <>{page}</>;
}
