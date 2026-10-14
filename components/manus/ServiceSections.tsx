import { Fragment } from "react";
import { Icon } from "./components";
import type {
  SeoPricingFactor,
  SeoRelatedService,
  SeoSection,
  SeoSource,
} from "./seoTypes";
import "./service-seo.css";

export type Crumb = { label: string; href?: string };

export function sectionId(heading: string): string {
  return (
    "section-" +
    heading
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="svc-breadcrumbs" aria-label="Breadcrumb">
      <div className="container">
        <ol>
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`}>
              {item.href ? (
                <a href={item.href}>{item.label}</a>
              ) : (
                <span aria-current="page">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

export function OnThisPage({ sections }: { sections: SeoSection[] }) {
  if (sections.length < 5) return null;
  return (
    <nav className="svc-on-this-page" aria-label="On this page">
      <div className="container">
        <span className="svc-otp-label">ON THIS PAGE</span>
        <ul>
          {sections.map((section) => (
            <li key={section.heading}>
              <a href={`#${sectionId(section.heading)}`}>{section.heading}</a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

function SectionHeading({ section }: { section: SeoSection }) {
  return <h2 id={sectionId(section.heading)}>{section.heading}</h2>;
}

function SectionBody({ section }: { section: SeoSection }) {
  switch (section.kind) {
    case "prose":
      return (
        <>
          {(section.paragraphs ?? []).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </>
      );
    case "bullets":
      return (
        <>
          {section.intro && <p>{section.intro}</p>}
          <ul className="svc-bullets">
            {(section.items ?? []).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </>
      );
    case "steps":
      return (
        <>
          {section.intro && <p>{section.intro}</p>}
          <ol className="svc-steps">
            {(section.steps ?? []).map((step, index) => (
              <li key={index}>
                <span className="svc-step-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <b>{step.title}</b>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </>
      );
    case "table": {
      const columns = section.columns ?? [];
      return (
        <>
          {section.intro && <p>{section.intro}</p>}
          <div
            className="svc-table-scroll"
            role="region"
            tabIndex={0}
            aria-label={`${section.heading} table`}
          >
            <table className="svc-table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column} scope="col">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(section.rows ?? []).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) =>
                      cellIndex === 0 ? (
                        <th key={cellIndex} scope="row">
                          {cell}
                        </th>
                      ) : (
                        <td key={cellIndex}>{cell}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {section.note && <p className="svc-table-note">{section.note}</p>}
        </>
      );
    }
    case "callout":
      return (
        <>
          {(section.paragraphs ?? []).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </>
      );
    case "links":
      return (
        <ul className="svc-links">
          {(section.links ?? []).map((link, index) => (
            <li key={index}>
              <a href={link.route}>
                {link.label}
                <Icon name="arrow" size={14} />
              </a>
              {link.description && <span>{link.description}</span>}
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

export function ContentSections({
  intro = [],
  sections,
  first = false,
}: {
  intro?: string[];
  sections: SeoSection[];
  first?: boolean;
}) {
  return (
    <div className="svc-body">
      {first && intro.length > 0 && (
        <div className="svc-intro">
          {intro.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}
      {sections.map((section, index) =>
        section.kind === "callout" ? (
          <div
            className={`svc-callout svc-callout-${section.tone ?? "info"}`}
            key={index}
          >
            <span className="svc-callout-mark" aria-hidden="true">
              <Icon
                name={
                  section.tone === "safety" || section.tone === "warning"
                    ? "shield"
                    : "chat"
                }
                size={20}
              />
            </span>
            <div>
              <h3>{section.heading}</h3>
              <SectionBody section={section} />
            </div>
          </div>
        ) : (
          <section className="svc-section" key={index}>
            <SectionHeading section={section} />
            <SectionBody section={section} />
          </section>
        ),
      )}
    </div>
  );
}

export function PricingSection({ factors }: { factors: SeoPricingFactor[] }) {
  if (!factors.length) return null;
  return (
    <section className="svc-pricing-section">
      <div className="container">
        <div className="svc-block-heading">
          <span className="eyebrow">HOW PRICING WORKS</span>
          <h2>What affects the cost of this work.</h2>
          <p>
            We do not publish fixed prices, because the right figure depends on
            what is actually found on site. These are the factors that shape a
            quote, and the proposed scope and price are explained before agreed
            work proceeds.
          </p>
        </div>
        <div className="svc-pricing-grid">
          {factors.map((item, index) => (
            <article className="svc-pricing-card" key={item.factor}>
              <span className="svc-pricing-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <b>{item.factor}</b>
              <p>{item.explanation}</p>
            </article>
          ))}
        </div>
        <p className="svc-pricing-note">
          Every business prices this work differently, and the figure depends on
          the assessment outcome, access, parts and whether attendance is
          outside standard hours. Ask for the proposed scope and price before
          work starts.
        </p>
      </div>
    </section>
  );
}

export function RelatedServices({ items }: { items: SeoRelatedService[] }) {
  if (!items.length) return null;
  return (
    <section className="svc-related-section">
      <div className="container">
        <div className="svc-block-heading">
          <span className="eyebrow">RELATED PLUMBING HELP</span>
          <h2>Services that often go with this one.</h2>
        </div>
        <div className="svc-related-grid">
          {items.map((item) => (
            <a
              className="svc-related-card"
              href={item.route}
              key={`${item.route}-${item.label}`}
            >
              <b>{item.label}</b>
              {item.why && <span>{item.why}</span>}
              <span className="svc-related-arrow" aria-hidden="true">
                <Icon name="arrow" size={14} />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SourceNotes({ sources }: { sources: SeoSource[] }) {
  if (!sources.length) return null;
  return (
    <section className="svc-sources">
      <div className="container">
        <h2>Guidance and reference sources</h2>
        <p>
          General plumbing, safety and compliance guidance on this page was
          checked against the following Australian sources. Nothing on this page
          replaces an on-site assessment.
        </p>
        <ul>
          {sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function InlineLinks({ items }: { items: SeoRelatedService[] }) {
  if (!items.length) return null;
  return (
    <p className="svc-inline-links">
      {items.map((item, index) => (
        <Fragment key={`${item.route}-${index}`}>
          {index > 0 && <span aria-hidden="true"> · </span>}
          <a href={item.route}>{item.label}</a>
        </Fragment>
      ))}
    </p>
  );
}
