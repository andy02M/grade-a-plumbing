import type { Metadata } from "next";
import ManusApp from "@/components/manus/App";
import { getRequestLocation } from "@/lib/location-request";
import { locations } from "@/lib/locations";
import { pageCanonical } from "@/lib/canonical-policy";
export async function generateMetadata(): Promise<Metadata> {
  const l = await getRequestLocation();
  return {
    title: "Plumbing Service Areas | Grade A Plumbing",
    description:
      "Search Melbourne suburbs and selected Sydney locations, and confirm plumbing service availability.",
    alternates: { canonical: pageCanonical(l.website, "/service-areas/") },
  };
}
export default function ServiceAreas() {
  return (
    <>
      <ManusApp initialPath="/service-areas/" embedded />
      <section className="section">
        <div className="container">
          <h2>Our location websites</h2>
          <div className="location-website-grid">
            {locations.map((l) => (
              <a key={l.slug} href={l.website + "/"}>
                {l.location}
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
