export type PlumberEtaResult = {
  lines: string[];
  mapsEnabled: boolean;
};

type DistanceMatrixResponse = {
  destination_addresses?: string[];
  error_message?: string;
  origin_addresses?: string[];
  rows?: Array<{
    elements?: Array<{
      distance?: {
        text?: string;
        value?: number;
      };
      duration?: {
        text?: string;
        value?: number;
      };
      status?: string;
    }>;
  }>;
  status?: string;
};

type Plumber = {
  name: string;
  origin: string;
  region: string;
  serviceArea: "bendigo" | "caulfield" | "everywhere" | "melton" | "narre_warren" | "north_west";
};

const googleMapsApiBaseUrl = "https://maps.googleapis.com/maps/api";

const plumbers: Plumber[] = [
  {
    name: "Jamil",
    origin: "Craigieburn VIC, Australia",
    region: "Everywhere",
    serviceArea: "everywhere"
  },
  {
    name: "Jak",
    origin: "Craigieburn VIC, Australia",
    region: "Everywhere",
    serviceArea: "everywhere"
  },
  {
    name: "James",
    origin: "Caulfield VIC, Australia",
    region: "Caulfield Region",
    serviceArea: "caulfield"
  },
  {
    name: "Adam",
    origin: "Craigieburn VIC, Australia",
    region: "Everywhere",
    serviceArea: "everywhere"
  },
  {
    name: "Kamil",
    origin: "Essendon VIC, Australia",
    region: "North and West Suburbs",
    serviceArea: "north_west"
  },
  {
    name: "Akash",
    origin: "Melton VIC, Australia",
    region: "Melton Region",
    serviceArea: "melton"
  },
  {
    name: "Tap On Plumber Bendigo",
    origin: "Bendigo VIC, Australia",
    region: "Bendigo",
    serviceArea: "bendigo"
  },
  {
    name: "Rahim",
    origin: "Narre Warren VIC, Australia",
    region: "Narre Warren Region",
    serviceArea: "narre_warren"
  },
  {
    name: "Dean",
    origin: "Narre Warren VIC, Australia",
    region: "Narre Warren Region",
    serviceArea: "narre_warren"
  },
  {
    name: "Peter Carr Plumbing",
    origin: "Bendigo VIC, Australia",
    region: "Bendigo",
    serviceArea: "bendigo"
  }
];

const regionSuburbs: Record<Exclude<Plumber["serviceArea"], "everywhere">, string[]> = {
  bendigo: [
    "bendigo",
    "eaglehawk",
    "epsom",
    "flora hill",
    "golden square",
    "kangaroo flat",
    "kennington",
    "long gully",
    "maiden gully",
    "strathdale",
    "white hills"
  ],
  caulfield: [
    "balaclava",
    "bentleigh",
    "brighton",
    "caulfield",
    "caulfield east",
    "caulfield north",
    "caulfield south",
    "carnegie",
    "elsternwick",
    "glen huntly",
    "malvern",
    "ormond",
    "st kilda"
  ],
  melton: [
    "bacchus marsh",
    "burnside",
    "caroline springs",
    "deer park",
    "harkness",
    "kurunjang",
    "melton",
    "melton south",
    "melton west",
    "rockbank",
    "ravenhall",
    "taylors hill",
    "toolern vale"
  ],
  narre_warren: [
    "beaconsfield",
    "berwick",
    "clyde",
    "cranbourne",
    "dandenong",
    "endeavour hills",
    "hallam",
    "hampton park",
    "narre warren",
    "pakenham",
    "rowville"
  ],
  north_west: [
    "airport west",
    "altona",
    "ascot vale",
    "avondale heights",
    "braybrook",
    "brunswick",
    "coburg",
    "craigieburn",
    "deer park",
    "essendon",
    "footscray",
    "glenroy",
    "keilor",
    "maribyrnong",
    "moonee ponds",
    "niddrie",
    "pascoe vale",
    "preston",
    "reservoir",
    "st albans",
    "strathmore",
    "sunbury",
    "sunshine",
    "sydenham",
    "taylors lakes",
    "thomastown",
    "werribee"
  ]
};

export async function getPlumberEtaLines(locationInput: string): Promise<PlumberEtaResult> {
  const apiKey = getGoogleMapsApiKey();

  if (!locationInput.trim()) {
    return {
      lines: [],
      mapsEnabled: Boolean(apiKey)
    };
  }

  if (!apiKey) {
    return {
      lines: [
        "🟨📍 ADDRESS CHECK",
        "Google Maps API key is not configured yet.",
        ""
      ],
      mapsEnabled: false
    };
  }

  try {
    const validation = await geocodeAddress(locationInput, apiKey);
    const destination = validation.placeId ? `place_id:${validation.placeId}` : validation.formattedAddress || locationInput;
    const etaResults = await getDistanceMatrix(destination, apiKey);
    const sortedResults = etaResults
      .map((eta, index) => ({
        ...eta,
        plumber: plumbers[index],
        serviceMatch: isServiceAreaMatch(plumbers[index], validation.formattedAddress || locationInput)
      }))
      .sort((a, b) => {
        if (a.serviceMatch !== b.serviceMatch) {
          return a.serviceMatch ? -1 : 1;
        }

        return (a.durationValue ?? Number.MAX_SAFE_INTEGER) - (b.durationValue ?? Number.MAX_SAFE_INTEGER);
      });

    return {
      lines: formatEtaSummary(
        validation.formattedAddress || locationInput,
        validation.needsConfirmation,
        sortedResults
      ),
      mapsEnabled: true
    };
  } catch (error) {
    console.error("Google Maps plumber ETA failed", error);

    return {
      lines: [
        "🟥📍 ADDRESS CHECK",
        "Could not confirm address or calculate ETA right now.",
        ""
      ],
      mapsEnabled: true
    };
  }
}

async function geocodeAddress(locationInput: string, apiKey: string) {
  const url = new URL(`${googleMapsApiBaseUrl}/geocode/json`);
  url.searchParams.set("address", normalizeAustralianLocation(locationInput));
  url.searchParams.set("components", "country:AU|administrative_area:VIC");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("region", "au");

  const response = await fetch(url, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Google geocoding failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    results?: Array<{
      formatted_address?: string;
      partial_match?: boolean;
      place_id?: string;
      types?: string[];
    }>;
    status?: string;
  };
  const result = data.results?.[0];

  if (data.status !== "OK" || !result) {
    throw new Error(`Google geocoding status: ${data.status ?? "UNKNOWN"}`);
  }

  return {
    formattedAddress: result.formatted_address ?? "",
    needsConfirmation: Boolean(result.partial_match) || Boolean(result.types?.includes("plus_code")),
    placeId: result.place_id ?? ""
  };
}

async function getDistanceMatrix(destination: string, apiKey: string) {
  const url = new URL(`${googleMapsApiBaseUrl}/distancematrix/json`);
  url.searchParams.set("origins", plumbers.map((plumber) => plumber.origin).join("|"));
  url.searchParams.set("destinations", destination);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("mode", "driving");
  url.searchParams.set("region", "au");
  url.searchParams.set("units", "metric");

  const response = await fetch(url, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Google distance matrix failed: ${response.status}`);
  }

  const data = (await response.json()) as DistanceMatrixResponse;

  if (data.status !== "OK") {
    throw new Error(`Google distance matrix status: ${data.status ?? "UNKNOWN"} ${data.error_message ?? ""}`.trim());
  }

  return plumbers.map((_, index) => {
    const element = data.rows?.[index]?.elements?.[0];

    return {
      distanceText: element?.distance?.text,
      durationText: element?.duration?.text,
      durationValue: element?.duration?.value,
      status: element?.status
    };
  });
}

type EtaLineResult = {
  distanceText?: string;
  durationText?: string;
  plumber: Plumber;
  serviceMatch: boolean;
  status?: string;
};

function formatEtaSummary(address: string, needsConfirmation: boolean, results: EtaLineResult[]) {
  const usualArea = results.filter((result) => result.serviceMatch);
  const outsideArea = results.filter((result) => !result.serviceMatch);
  const best = results.find((result) => result.status === "OK" && result.durationText) ?? results[0];

  return [
    "🟩📍 ADDRESS CHECK",
    `✅ Matched: ${address}`,
    needsConfirmation ? "🟨 Confirm address before dispatch." : "",
    "",
    "🟦🚗 ETA GUIDE",
    best ? `🟢 Best: ${formatCompactEta(best)}` : "",
    ...formatEtaGroup("🟢 Usual area", usualArea.filter((result) => result !== best)),
    ...formatEtaGroup("🟠 Outside usual area", outsideArea.filter((result) => result !== best)),
    ""
  ].filter(Boolean);
}

function formatEtaGroup(label: string, results: EtaLineResult[]) {
  if (!results.length) {
    return [];
  }

  return [
    `${label}:`,
    ...chunkItems(results.map(formatCompactEta), 2).map((items) => `- ${items.join(" | ")}`)
  ];
}

function formatCompactEta(result: EtaLineResult) {
  const eta = result.status === "OK" && result.durationText ? result.durationText : "ETA unavailable";
  const distance = result.distanceText ? ` / ${formatDistance(result.distanceText)}` : "";

  return `${result.plumber.name} ${formatDuration(eta)}${distance}`;
}

function formatDuration(value: string) {
  return value.replace(/\bhours?\b/g, "hr").replace(/\bmins?\b/g, "min");
}

function formatDistance(value: string) {
  return value.replace(/\.0 km\b/g, " km");
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function isServiceAreaMatch(plumber: Plumber, addressText: string) {
  if (plumber.serviceArea === "everywhere") {
    return true;
  }

  const normalizedAddress = addressText.toLowerCase();

  return regionSuburbs[plumber.serviceArea].some((suburb) => normalizedAddress.includes(suburb));
}

function normalizeAustralianLocation(locationInput: string) {
  const normalizedInput = locationInput.trim();

  if (/\b(australia|vic|victoria)\b/i.test(normalizedInput)) {
    return normalizedInput;
  }

  return `${normalizedInput}, VIC, Australia`;
}

function getGoogleMapsApiKey() {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_SERVER_API_KEY || "";
}
