"use client";
import { useEffect, useMemo, useState } from "react";
import "./location.css";
import {
  loadLocationById,
  loadLocationCatalogue,
  locationEnquiryHref,
  locationLabel,
  locationMatchesQuery,
  searchLocations,
  type LocationRecord,
} from "./locationData";

function CoverageBadge({ location }: { location: LocationRecord }) {
  return (
    <span
      className={`location-coverage ${location.activeService ? "is-confirmed" : "is-unconfirmed"}`}
    >
      <span aria-hidden="true" className="location-coverage-dot" />
      {location.activeService
        ? "Confirmed service area"
        : "Availability to confirm"}
    </span>
  );
}

export function LocationAutocomplete({
  id,
  label = "Suburb or postcode",
  defaultLocationId = "",
  required = false,
  placeholder = "Search suburb or postcode…",
  onSelect,
}: {
  id: string;
  label?: string;
  defaultLocationId?: string;
  required?: boolean;
  placeholder?: string;
  onSelect?: (location: LocationRecord | null) => void;
}) {
  const [selected, setSelected] = useState<LocationRecord | null>(null);
  const [query, setQuery] = useState("");
  const [allLocations, setAllLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  useEffect(() => {
    let mounted = true;
    if (!defaultLocationId) {
      return () => {
        mounted = false;
      };
    }
    loadLocationById(defaultLocationId)
      .then((location) => {
        if (!mounted) return;
        setSelected(location ?? null);
        setQuery(location ? locationLabel(location) : "");
        onSelect?.(location ?? null);
      })
      .catch(() => {
        if (mounted) {
          setSelected(null);
          setQuery("");
        }
      });
    return () => {
      mounted = false;
    };
  }, [defaultLocationId]);
  useEffect(() => {
    let mounted = true;
    if (query.trim().length < 2 || selected) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }
    setLoading(true);
    loadLocationCatalogue()
      .then((catalogue) => {
        if (mounted) setAllLocations(catalogue.locations);
      })
      .catch(() => {
        if (mounted) setAllLocations([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [query, selected]);
  const results = useMemo(
    () => (open ? searchLocations(query, allLocations) : []),
    [open, query, allLocations],
  );
  const helpId = `${id}-help`;
  const listId = `${id}-listbox`;
  function choose(location: LocationRecord) {
    setSelected(location);
    setQuery(locationLabel(location));
    setOpen(false);
    setActive(0);
    onSelect?.(location);
  }
  function clear() {
    setSelected(null);
    setQuery("");
    setOpen(false);
    setActive(0);
    onSelect?.(null);
  }
  return (
    <div className="location-picker">
      <div className="location-picker-control">
        <input
          id={id}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && query.trim().length >= 2}
          aria-controls={open && query.trim().length >= 2 ? listId : undefined}
          aria-activedescendant={
            open && results[active]
              ? `${listId}-${results[active].id}`
              : undefined
          }
          aria-describedby={helpId}
          aria-required={required}
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected(null);
            setOpen(true);
            setActive(0);
            onSelect?.(null);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && results.length) {
              event.preventDefault();
              setOpen(true);
              setActive((index) => (index + 1) % results.length);
            } else if (event.key === "ArrowUp" && results.length) {
              event.preventDefault();
              setOpen(true);
              setActive(
                (index) => (index - 1 + results.length) % results.length,
              );
            } else if (event.key === "Enter" && open && results[active]) {
              event.preventDefault();
              choose(results[active]);
            } else if (event.key === "Escape") setOpen(false);
          }}
        />
        {query && (
          <button
            className="location-picker-clear"
            type="button"
            aria-label="Clear suburb or postcode"
            onClick={clear}
          >
            ×
          </button>
        )}
      </div>
      {open && query.trim().length >= 2 && (
        <ul
          className="location-picker-list"
          role="listbox"
          id={listId}
          aria-label="Matching suburbs and postcodes"
        >
          {loading && !allLocations.length ? (
            <li
              className="location-picker-empty"
              role="option"
              aria-selected="false"
            >
              Loading locality and postcode records…
            </li>
          ) : results.length ? (
            results.map((location, index) => (
              <li
                key={location.id}
                id={`${listId}-${location.id}`}
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(location)}
              >
                <span className="location-option-main">
                  <b>{location.name}</b>
                  <span>
                    {location.state} {location.postcode} · {location.region}
                  </span>
                </span>
                <CoverageBadge location={location} />
              </li>
            ))
          ) : (
            <li
              className="location-picker-empty"
              role="option"
              aria-selected="false"
            >
              No matching official locality/postcode pair. Try a suburb name or
              four-digit postcode.
            </li>
          )}
        </ul>
      )}
      <p className="location-picker-help" id={helpId}>
        {selected ? (
          <>
            <b>{locationLabel(selected)}</b> ·{" "}
            <CoverageBadge location={selected} />
            {!selected.activeService && (
              <span className="location-unconfirmed-note">
                {" "}
                Service availability is not confirmed; please enquire.
              </span>
            )}
          </>
        ) : (
          "Choose a listed locality and postcode. Unconfirmed locations can still be selected so the team can check coverage."
        )}
      </p>
      {selected && (
        <div className="location-picker-selected">
          <a href={locationEnquiryHref(selected)}>
            Continue with {selected.name}
          </a>
          {selected.website && (
            <a
              href={selected.website}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open {selected.businessName} website{" "}
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
      )}
      <input type="hidden" name="locationId" value={selected?.id ?? ""} />
      <input type="hidden" name="suburb" value={selected?.name ?? ""} />
      <input type="hidden" name="postcode" value={selected?.postcode ?? ""} />
      <input type="hidden" name="state" value={selected?.state ?? ""} />
      <input type="hidden" name="region" value={selected?.region ?? ""} />
      <input type="hidden" name="lga" value={selected?.lga ?? ""} />
      <input
        type="hidden"
        name="coverageStatus"
        value={selected?.coverageStatus ?? ""}
      />
      <input
        type="hidden"
        name="routingBusiness"
        value={selected?.businessName ?? ""}
      />
      <input
        type="hidden"
        name="routingWebsite"
        value={selected?.website ?? ""}
      />
    </div>
  );
}

function LocationRow({ location }: { location: LocationRecord }) {
  return (
    <li className="location-directory-row">
      <div className="location-directory-details">
        <b>{location.name}</b>
        <span>
          {location.state} {location.postcode}
          {location.lga ? ` · ${location.lga}` : ""}
        </span>
        <CoverageBadge location={location} />
      </div>
      <div className="location-directory-actions">
        <a
          className="location-enquiry-link"
          href={locationEnquiryHref(location)}
        >
          {location.activeService
            ? "Ask about this location"
            : "Check availability"}
        </a>
        {location.website ? (
          <a
            className="location-site-link"
            href={location.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            {location.businessName}{" "}
            <span className="sr-only">website (opens in a new tab)</span> ↗
          </a>
        ) : (
          <span className="location-link-unset">
            Location website not supplied
          </span>
        )}
      </div>
    </li>
  );
}

const alphabet = ["All", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

export function LocationDirectory() {
  const [locationRecords, setLocationRecords] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState(false);
  useEffect(() => {
    let mounted = true;
    loadLocationCatalogue()
      .then((catalogue) => {
        if (mounted) setLocationRecords(catalogue.locations);
      })
      .catch(() => {
        if (mounted) setCatalogueError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);
  const [state, setState] = useState<"VIC" | "NSW">("VIC");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("state") === "NSW")
      setState("NSW");
  }, []);
  const [region, setRegion] = useState("All regions");
  const [coverage, setCoverage] = useState<"all" | "confirmed" | "unconfirmed">(
    "all",
  );
  const [letter, setLetter] = useState("All");
  const [query, setQuery] = useState("");
  const regionalRecords = useMemo(
    () => locationRecords.filter((location) => location.state === state),
    [locationRecords, state],
  );
  const regions = useMemo(
    () =>
      [...new Set(regionalRecords.map((location) => location.region))].sort(
        (a, b) => a.localeCompare(b, "en-AU"),
      ),
    [regionalRecords],
  );
  const filtered = useMemo(() => {
    return regionalRecords
      .filter((location) => {
        const matchesRegion =
          region === "All regions" || location.region === region;
        const matchesCoverage =
          coverage === "all" ||
          (coverage === "confirmed"
            ? location.activeService
            : !location.activeService);
        const matchesLetter =
          letter === "All" ||
          location.name.toLocaleUpperCase("en-AU").startsWith(letter);
        const matchesQuery =
          !query.trim() || locationMatchesQuery(query, location);
        return (
          matchesRegion && matchesCoverage && matchesLetter && matchesQuery
        );
      })
      .sort(
        (a, b) =>
          a.name.localeCompare(b.name, "en-AU") ||
          a.postcode.localeCompare(b.postcode),
      );
  }, [regionalRecords, region, coverage, letter, query]);
  const grouped = useMemo(() => {
    const map = new Map<string, LocationRecord[]>();
    for (const location of filtered)
      map.set(location.region, [...(map.get(location.region) ?? []), location]);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "en-AU"));
  }, [filtered]);
  function chooseState(next: "VIC" | "NSW") {
    setState(next);
    setRegion("All regions");
    setLetter("All");
    setQuery("");
  }
  return (
    <section
      className="location-directory"
      aria-labelledby="location-directory-heading"
    >
      <div className="location-directory-topline">
        <div>
          <span className="eyebrow">LOCATION DIRECTORY</span>
          <h2 id="location-directory-heading">Choose a suburb or postcode.</h2>
          <p>
            Search the verified location list, narrow it by region, or browse
            alphabetically.
          </p>
        </div>
        <div className="location-city-tabs" aria-label="Select a service state">
          <button
            type="button"
            aria-pressed={state === "VIC"}
            onClick={() => chooseState("VIC")}
          >
            Melbourne · VIC
          </button>
          <button
            type="button"
            aria-pressed={state === "NSW"}
            onClick={() => chooseState("NSW")}
          >
            Sydney · NSW
          </button>
        </div>
      </div>
      <div className="location-directory-controls">
        <label className="location-directory-search">
          <span>Search locations</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Suburb, postcode, council or region"
          />
        </label>
        <label>
          <span>Region</span>
          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          >
            <option>All regions</option>
            {regions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Coverage status</span>
          <select
            value={coverage}
            onChange={(event) =>
              setCoverage(event.target.value as typeof coverage)
            }
          >
            <option value="all">All locations</option>
            <option value="confirmed">Confirmed service areas</option>
            <option value="unconfirmed">Availability to confirm</option>
          </select>
        </label>
      </div>
      <nav className="location-alphabet" aria-label="Browse by first letter">
        {alphabet.map((item) => (
          <button
            type="button"
            key={item}
            aria-pressed={letter === item}
            onClick={() => setLetter(item)}
          >
            {item}
          </button>
        ))}
      </nav>
      <p className="location-directory-count" role="status" aria-live="polite">
        {loading ? (
          "Loading location records…"
        ) : catalogueError ? (
          "The location catalogue could not be loaded. Please try again shortly."
        ) : (
          <>
            {filtered.length} location{" "}
            {filtered.length === 1 ? "record" : "records"} shown.{" "}
            {state === "VIC"
              ? "Only records marked confirmed match the existing website service-area list; other locations require confirmation."
              : "These three Sydney locations were specified by the business."}
          </>
        )}
      </p>
      {!loading && !catalogueError && grouped.length ? (
        <div className="location-region-list">
          {grouped.map(([name, items], index) => (
            <details
              className="location-region"
              key={name}
              open={
                region !== "All regions" ||
                coverage !== "all" ||
                letter !== "All" ||
                (query.length > 0 && index === 0)
              }
            >
              <summary>
                <span>{name}</span>
                <b>
                  {items.length} {items.length === 1 ? "location" : "locations"}
                </b>
              </summary>
              <ul>
                {items.map((location) => (
                  <LocationRow key={location.id} location={location} />
                ))}
              </ul>
            </details>
          ))}
        </div>
      ) : (
        !loading &&
        !catalogueError && (
          <p className="location-empty-result">
            No locations match those filters. Try another region or contact the
            team to ask about your suburb.
          </p>
        )
      )}
      {state === "VIC" && (
        <p className="location-source-note">
          The Melbourne list is derived from bounded Victorian Government
          localities with a positive-area overlap against the ABS 2021 Greater
          Melbourne (2GMEL) boundary. Some outer statistical-area localities may
          not match everyday usage. Geographic inclusion is not a service
          promise: unconfirmed locations require a coverage check. Sources:{" "}
          <a
            href="https://discover.data.vic.gov.au/dataset/vicmap-admin-locality-polygon-aligned-to-property"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vicmap locality boundaries
          </a>
          ,{" "}
          <a
            href="https://discover.data.vic.gov.au/dataset/vicmap-admin-postcode-polygon"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vicmap postcode boundaries
          </a>
          , and{" "}
          <a
            href="https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-3-july-2021-june-2026/main-structure-and-greater-capital-city-statistical-areas/greater-capital-city-statistical-areas"
            target="_blank"
            rel="noopener noreferrer"
          >
            ABS Greater Capital City Statistical Areas
          </a>
          .
        </p>
      )}
      <p className="location-management-note">
        Coverage status is a business setting, not a geographic fact. This
        preview is read-only: no administrator sign-in or persistent database is
        connected, so status changes cannot be saved here.
      </p>
    </section>
  );
}
