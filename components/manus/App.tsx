"use client";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  Button,
  EmergencyPanel,
  Footer,
  Gallery,
  Header,
  Icon,
  MobileActions,
  QuoteForm,
  SectionHeading,
  ServiceCard,
  TrustStrip,
} from "./components";
import { PHONE, PHONE_LINK, processSteps, reviews, services } from "./data";
import { isMarketingRoute, normalizePageRoute } from "./routes";
import { LocationAutocomplete } from "./LocationFeatures";
import {
  locationEnquiryHref,
  locationLabel,
  SYDNEY_LOCATIONS,
  type LocationRecord,
} from "./locationData";

const MarketingPage = lazy(() => import("./MarketingPages"));

const heroImage = "/assets/sharp/01_Hero_Plumber_Under_Sink.jpg";
const differenceImage = "/assets/external/freestanding-bathtub-unsplash.jpg";
const skylineImage = "/assets/external/melbourne-yarra-skyline-wikimedia.jpg";

function setMeta(title: string, description: string) {
  document.title = title;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", description);
}

function Hero() {
  return (
    <section className="hero" style={{ backgroundImage: `url(${heroImage})` }}>
      <div className="hero-overlay" />
      <div className="container hero-content">
        <span className="eyebrow">MELBOURNE'S LOCAL PLUMBING TEAM</span>
        <h1>
          Plumbing done
          <br />
          right. <strong>Day or night.</strong>
        </h1>
        <p>
          From blocked drains and burst pipes to hot water repairs and emergency
          plumbing, Grade A Plumbing provides practical plumbing solutions
          across Melbourne and surrounding suburbs.
        </p>
        <div className="hero-actions">
          <Button href={PHONE_LINK}>Call a plumber now</Button>
          <Button href="/contact-us/" variant="dark">
            Request a free quote
          </Button>
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  return (
    <section className="section services-section">
      <div className="container services-layout">
        <div className="services-main">
          <SectionHeading
            eyebrow="OUR SERVICES"
            title={
              <>
                Plumbing solutions
                <br />
                for every property.
              </>
            }
            body="From small repairs to urgent plumbing problems, we help Melbourne homes and businesses keep essential plumbing systems working properly."
            action={
              <Button href="/services/" variant="outline">
                View all services
              </Button>
            }
          />
          <div className="services-grid">
            {services.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        </div>
        <QuoteForm compact />
      </div>
    </section>
  );
}

function DifferenceSection() {
  const benefits = [
    ["chat", "Clear communication", "We explain the work and your options."],
    [
      "shield",
      "Careful, respectful work",
      "We treat your home or business with care.",
    ],
    [
      "bulb",
      "Practical plumbing advice",
      "Helpful guidance for your property.",
    ],
    ["doc", "Upfront pricing", "You'll know the cost before we proceed."],
    [
      "building",
      "Residential & commercial",
      "Experience across all property types.",
    ],
    ["clock", "Emergency assistance", "We're available when you need us."],
  ] as const;
  return (
    <section className="section difference-section">
      <div className="container difference-layout">
        <div className="difference-photo">
          <img
            src={differenceImage}
            alt="Reference image of a freestanding bathtub in a bright bathroom"
          />
        </div>
        <div className="difference-copy">
          <span className="eyebrow">THE GRADE A DIFFERENCE</span>
          <h2>
            GOOD PLUMBING IS ABOUT
            <br />
            MORE THAN FIXING PIPES.
          </h2>
          <p>
            It's about turning up prepared, communicating clearly, respecting
            your property and making sure you understand the work before it
            begins.
          </p>
          <div className="benefit-grid">
            {benefits.map(([icon, title, body]) => (
              <div className="benefit" key={title}>
                <Icon name={icon} size={27} />
                <div>
                  <b>{title}</b>
                  <span>{body}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function GallerySection() {
  return (
    <section className="section gallery-section">
      <div className="container">
        <SectionHeading
          eyebrow="PROJECT GALLERY"
          title="Real work. Real results."
          body="Illustrative reference images are shown here; these are not verified photographs of completed Grade A Plumbing jobs."
          action={
            <Button href="/our-work/" variant="outline">
              View full gallery
            </Button>
          }
        />
        <Gallery preview />
      </div>
    </section>
  );
}

function ReviewsSection() {
  return (
    <section className="section reviews-section">
      <div className="container review-layout">
        <div className="reviews-main">
          <SectionHeading
            eyebrow="CUSTOMER REVIEWS"
            title="What our customers say."
            body="Read genuine review excerpts from our customers on Google."
            action={
              <Button href="/reviews/" variant="outline">
                View all reviews
              </Button>
            }
          />
          <div className="review-grid">
            {reviews.map((review) => (
              <article className="review-card" key={review.name}>
                <div className="review-source">
                  <span className="google-mark">G</span>
                  <span className="stars">★★★★★</span>
                </div>
                <p>“{review.quote}”</p>
                <footer>
                  <b>{review.name}</b>
                  <small>{review.time}</small>
                  <Icon name="external" size={13} />
                </footer>
              </article>
            ))}
          </div>
        </div>
        <EmergencyPanel />
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className="section process-section">
      <div className="container">
        <SectionHeading
          eyebrow="SIMPLE FROM START TO FINISH"
          title="Plumbing help without the confusion."
        />
        <div className="process-grid">
          {processSteps.map((step, index) => (
            <div className="process-step" key={step.number}>
              <div className="process-icon">
                <span>
                  {index === 0 ? (
                    <Icon name="phone" />
                  ) : index === 1 ? (
                    <Icon name="doc" />
                  ) : index === 2 ? (
                    "$"
                  ) : (
                    <Icon name="check" />
                  )}
                </span>
                <b>{step.number}</b>
              </div>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AreasSection() {
  const [selectedLocation, setSelectedLocation] =
    useState<LocationRecord | null>(null);
  const sydneyLocations = SYDNEY_LOCATIONS;
  return (
    <section className="section areas-section">
      <div className="areas-photo">
        <img
          src={skylineImage}
          alt="Melbourne skyline and Yarra River reference image"
        />
      </div>
      <div className="areas-copy">
        <div className="container areas-inner">
          <SectionHeading
            eyebrow="SERVICE AREA"
            title="Local plumbing help across Melbourne and selected Sydney locations."
            body="Search by official suburb/locality and postcode. Coverage is marked separately; new areas remain unconfirmed until checked."
            action={
              <Button href="/service-areas/" variant="outline">
                Browse service areas
              </Button>
            }
          />
          <div className="location-home-field">
            <label htmlFor="homepage-location-picker">
              Select a Melbourne or Sydney location
            </label>
            <LocationAutocomplete
              id="homepage-location-picker"
              onSelect={setSelectedLocation}
              placeholder="Search suburb or postcode…"
            />
            {selectedLocation && (
              <div className="location-home-selection">
                <span
                  className={`location-coverage ${selectedLocation.activeService ? "is-confirmed" : "is-unconfirmed"}`}
                >
                  <span className="location-coverage-dot" aria-hidden="true" />
                  {selectedLocation.activeService
                    ? "Confirmed service area"
                    : "Availability to confirm"}
                </span>
                <a href={locationEnquiryHref(selectedLocation)}>
                  Continue with {locationLabel(selectedLocation)}
                </a>
              </div>
            )}
          </div>
          <p className="location-home-links">
            <a href="/service-areas/?state=VIC">Browse Melbourne A–Z</a>
            <a href="/service-areas/?state=NSW">Browse Sydney locations</a>
          </p>
          <div
            className="location-home-sydney"
            aria-label="Confirmed Sydney locations"
          >
            {sydneyLocations.map((location) => (
              <article
                className="location-home-location-card"
                key={location.id}
              >
                <div>
                  <b>{location.name}</b>
                  <span>
                    {location.state} {location.postcode} · {location.lga}
                  </span>
                </div>
                <div className="location-home-card-actions">
                  <a
                    href={location.website ?? locationEnquiryHref(location)}
                    target={location.website ? "_blank" : undefined}
                    rel={location.website ? "noopener noreferrer" : undefined}
                  >
                    {location.website ? "Open local website" : "Visit location"}
                  </a>
                  <a href={locationEnquiryHref(location)}>
                    Enquire on this preview
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NotFoundPage() {
  return (
    <section className="page-hero not-found-page">
      <div className="container page-hero-inner">
        <span className="eyebrow">404 · PAGE NOT FOUND</span>
        <h1>That page is not on the map.</h1>
        <p>
          Try the homepage, browse our services or call Grade A Plumbing for
          help across Melbourne.
        </p>
        <div className="hero-actions">
          <Button href="/">Back to home</Button>
          <Button href={PHONE_LINK} variant="dark">
            Call {PHONE}
          </Button>
        </div>
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <ServicesSection />
      <DifferenceSection />
      <GallerySection />
      <ReviewsSection />
      <ProcessSection />
      <AreasSection />
    </>
  );
}

export default function App({
  initialPath,
  embedded = false,
}: { initialPath?: string; embedded?: boolean } = {}) {
  const rawPath =
    initialPath ??
    (typeof window === "undefined" ? "/" : window.location.pathname);
  const path = normalizePageRoute(rawPath);
  const isHome = path === "/";
  const isKnown = isMarketingRoute(rawPath);
  return (
    <div className={`app ${isHome ? "app-home" : ""}`}>
      {!embedded && <Header />}
      <main>
        {isHome ? (
          <HomePage />
        ) : isKnown ? (
          <Suspense fallback={null}>
            <MarketingPage path={path} />
          </Suspense>
        ) : (
          <NotFoundPage />
        )}
      </main>
      {!embedded && (
        <>
          <Footer />
          <MobileActions />
        </>
      )}
    </div>
  );
}
