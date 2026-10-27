import { ResponsiveImage } from "@/components/ResponsiveImage";
import Image from "next/image";
import performanceAssets from "@/data/performance-assets.json";
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
import { normalizePageRoute, publicPageHref } from "./routes";
import {AreasSection,type NearbyLink,type HomeLocalGuidance} from "./HomeAreas";


const heroImage = "/assets/sharp/01_Hero_Plumber_Under_Sink.jpg";
const differenceImage = "/assets/external/freestanding-bathtub-unsplash.jpg";


function Hero({ locationName }: { locationName: string }) {
  return (
    <section className="hero">
      <link rel="preload" as="image" type="image/avif" imageSrcSet={performanceAssets.heroSrcSet} imageSizes="100vw" fetchPriority="high" />
      <picture>
        <source type="image/avif" srcSet={performanceAssets.heroSrcSet} sizes="100vw" />
        <Image src={heroImage} alt="" fill loading="eager" sizes="100vw" fetchPriority="high" decoding="sync" quality={65} className="hero-photo" />
      </picture>
      <div className="hero-overlay" />
      <div className="container hero-content">
        <a className="hero-google-rating" href={publicPageHref('/reviews/')}>
          <span className="hero-google-rating-mark" aria-hidden="true">
            <ResponsiveImage src="/assets/google-g-logo.webp" alt="" width={20} height={20} sizes="20px" loading="eager" />
          </span>
          <span>Highly Rated on Google</span>
        </a>
        <span className="eyebrow">{locationName.toUpperCase()} · LOCAL PLUMBING TEAM</span>
        <h1>
          {locationName} plumbing
          <br />
          done right. <strong>Day or night.</strong>
        </h1>
        <p>
          From blocked drains and burst pipes to hot water repairs and emergency
          plumbing, Grade A Plumbing provides practical plumbing solutions
          in {locationName} and surrounding service areas.
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
          <ResponsiveImage
            src={differenceImage}
            sizes="(max-width: 768px) 100vw, 560px"
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
          body="A selection of completed Grade A Plumbing projects across bathrooms, kitchens, hot water, drainage and pipework."
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

function HomePage({ locationName, nearbyLocations, localPropertyGuidance }: { locationName: string; nearbyLocations: NearbyLink[];localPropertyGuidance?:HomeLocalGuidance }) {
  return (
    <>
      <Hero locationName={locationName} />
      <TrustStrip showGoogleRating />
      <ServicesSection />
      <ReviewsSection />
      <DifferenceSection />
      <GallerySection />
      <ProcessSection />
      <AreasSection locationName={locationName} nearbyLocations={nearbyLocations} localPropertyGuidance={localPropertyGuidance} />
    </>
  );
}

export default function App({
  initialPath,
  embedded = false,
  locationName = "Melbourne",
  nearbyLocations = [],
  localPropertyGuidance,
  reviewPage = 1,
}: { initialPath?: string; embedded?: boolean; locationName?: string; nearbyLocations?: NearbyLink[];localPropertyGuidance?:HomeLocalGuidance;reviewPage?:number } = {}) {
  const rawPath = initialPath ?? "/";
  const path = normalizePageRoute(rawPath);
  const isHome = path === "/";
  return (
    <div className={`app ${isHome ? "app-home" : ""}`}>
      {!embedded && <Header />}
      <main>
        {isHome ? (
          <HomePage locationName={locationName} nearbyLocations={nearbyLocations} localPropertyGuidance={localPropertyGuidance} />
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
