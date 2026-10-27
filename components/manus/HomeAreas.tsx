"use client";
import {useState} from "react";
import {ResponsiveImage} from "@/components/ResponsiveImage";
import {Button,SectionHeading} from "./components";
import {LocationAutocomplete} from "./LocationFeatures";
import {publicPageHref} from "./routes";
import {locationEnquiryHref,locationLabel,SYDNEY_LOCATIONS,type LocationRecord} from "./locationData";
const skylineImage="/assets/external/melbourne-yarra-skyline-wikimedia.jpg";
export type NearbyLink = { name: string; url: string };
export type HomeLocalGuidance = {heading:string;introduction?:string;paragraphs:string[];sources:{title:string;url:string}[]};
export function AreasSection({ locationName, nearbyLocations, localPropertyGuidance }: { locationName: string; nearbyLocations: NearbyLink[]; localPropertyGuidance?:HomeLocalGuidance }) {
  const [selectedLocation, setSelectedLocation] =
    useState<LocationRecord | null>(null);
  const sydneyLocations = SYDNEY_LOCATIONS;
  return (
    <section className="section areas-section">
      <div className="areas-photo">
        <ResponsiveImage
          src={skylineImage}
          sizes="(max-width: 768px) 100vw, 50vw"
          alt="Melbourne skyline and Yarra River reference image"
        />
      </div>
      <div className="areas-copy">
        <div className="container areas-inner">
          <SectionHeading
            eyebrow="SERVICE AREA"
            title={locationName === "Melbourne" ? "Local plumbing help across Melbourne and selected Sydney locations." : `Plumbing service enquiries near ${locationName}.`}
            body="Search by official suburb/locality and postcode. Coverage is marked separately; new areas remain unconfirmed until checked."
            action={
              <Button href="/service-areas/" variant="outline">
                Browse service areas
              </Button>
            }
          />
          {localPropertyGuidance && <div className="location-booking-guidance"><p>{localPropertyGuidance.introduction}</p><details><summary>{localPropertyGuidance.heading}</summary>{localPropertyGuidance.paragraphs.map((paragraph,index)=><p key={index}>{paragraph}</p>)}<p>Authority information is general guidance, not a diagnosis or approval for your property.</p>{localPropertyGuidance.sources.map(source=><p key={source.url}><a href={source.url} rel="noopener noreferrer">{source.title}</a></p>)}</details></div>}
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
            <a href={publicPageHref('/service-areas/?state=VIC')}>Browse Melbourne A–Z</a>
            <a href={publicPageHref('/service-areas/?state=NSW')}>Browse Sydney locations</a>
          </p>
          {nearbyLocations.length > 0 && <nav className="location-home-links" aria-label={`Nearby service areas around ${locationName}`}>
            <span>Nearby location websites:</span>
            {nearbyLocations.map(item => <a key={item.url} href={item.url}>{item.name}</a>)}
          </nav>}
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
                    {location.website ? "Open local website" : "Request plumbing help"}
                  </a>
                  {location.website && <a href={locationEnquiryHref(location)}>Enquire about this location</a>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
