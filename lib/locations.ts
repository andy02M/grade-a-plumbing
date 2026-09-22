import { generatedNearbySuburbs } from "./generated-nearby-suburbs";
import { googleBusinessProfiles, type GoogleBusinessProfile } from "./google-business-profiles";
import { storefronts, type StorefrontAddress } from "./storefronts";

export type LocationTier = 1 | 2 | 3;

export type LocationConfig = {
  name: string;
  location: string;
  slug: string;
  hostname: string;
  website: string;
  state: "VIC";
  tier: LocationTier;
  phone?: string;
  phoneHref?: string;
  postcode?: string;
  address?: StorefrontAddress;
  googleBusinessProfile?: GoogleBusinessProfile;
  nearbySuburbs: string[];
  localIntroduction?: string;
  localProblems?: string[];
  propertyTypes?: string[];
  localExamples?: string[];
  recentJobs?: string[];
  localFaqs?: { question: string; answer: string }[];
  locationSpecificContent?: string;
  photos?: { src: string; alt: string; width: number; height: number }[];
};

const profiles = [
  "Grade A Plumbing Melbourne", "Grade A Plumbing St Albans", "Grade A Plumbing South Melbourne",
  "Grade A Plumber Pakenham", "Grade A Plumbing Ballarat", "Grade A Plumbing Bendigo",
  "Grade A Plumbing Geelong", "Grade A Plumbing Melton", "Grade A Plumbing Point Cook",
  "Grade A Plumbing Reservoir", "Grade A Plumbing Richmond", "Grade A Plumbing St Kilda",
  "Grade A Plumber Epping", "Grade A Plumber Footscray", "Grade A Plumber Glen Waverley",
  "Grade A Plumber Fitzroy", "Grade A Plumber Box Hill", "Grade A Plumber Hawthorn",
  "Grade A Plumber Essendon", "Grade A Plumber Ringwood", "Grade A Plumber Brighton",
  "Grade A Plumber Narre Warren", "Grade A Plumber Mornington", "Grade A Plumber Brunswick",
  "Grade A Plumber Dandenong", "Grade A Plumber Frankston", "Grade A Plumber Kew",
  "Grade A Plumber Caroline Springs", "Grade A Plumber Williamstown", "Grade A Plumber Kensington",
  "Grade A Plumber Blackburn", "Grade A Plumber Thornbury", "Grade A Plumber Craigieburn",
  "Grade A Plumber North Melbourne", "Grade A Plumber Berwick", "Grade A Plumber Hoppers Crossing",
  "Grade A Plumber Altona", "Grade A Plumber Bentleigh", "Grade A Plumber Moorabbin",
  "Grade A Plumber Bundoora", "Grade A Plumber Preston", "Grade A Plumber Doncaster",
  "Grade A Plumber Northcote", "Grade A Plumber Coburg", "Grade A Plumber Cremorne",
  "Grade A Plumber Werribee", "Grade A Plumber Camberwell", "Grade A Plumber Sunbury",
  "Grade A Plumber Sunshine", "Grade A Plumber Port Melbourne", "Grade A Plumber Balwyn",
  "Grade A Plumber Carlton", "Grade A Plumber Tarneit", "Grade A Plumber Cheltenham",
  "Grade A Plumber Newport", "Grade A Plumber Templestowe", "Grade A Plumber Hampton",
  "Grade A Plumber Lalor", "Grade A Plumber Mill Park", "Grade A Plumber Bulleen",
  "Grade A Plumber Malvern", "Grade A Plumber Prahran", "Grade A Plumber Mont Albert",
  "Grade A Plumber Burwood", "Grade A Plumber Springvale", "Grade A Plumber Clifton Hill",
  "Grade A Plumber Deanside", "Grade A Plumber Mount Waverley", "Grade A Plumber Strathmore",
  "Grade A Plumber Thomastown", "Grade A Plumber Toorak", "Grade A Plumber Chadstone",
  "Grade A Plumber Cranbourne", "Grade A Plumber Wantirna", "Grade A Plumber Bayswater",
  "Grade A Plumber Greenvale", "Grade A Plumber Ferntree Gully", "Grade A Plumber Yarraville",
  "Grade A Plumber Seaford", "Grade A Plumber South Yarra", "Grade A Plumber Ascot Vale",
  "Grade A Plumber South Morang"
] as const;

export function locationSlug(location: string) {
  return location.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const coburgOverrides: Partial<LocationConfig> = {
  tier: 1,
  nearbySuburbs: [
    "Coburg North", "Brunswick", "Brunswick East", "Brunswick West", "Pascoe Vale",
    "Preston", "Thornbury", "Northcote", "Fawkner", "Hadfield"
  ],
  localIntroduction:
    "Grade A Plumbing provides practical residential and commercial plumbing help in Coburg and nearby northern suburbs. From blocked drains and hot water faults to urgent leaks, we explain the available next step before work proceeds.",
  localProblems: [
    "Older drainage and pipework that needs careful diagnosis rather than guesswork",
    "Blocked sewer and stormwater lines in established properties",
    "Hot water faults in homes, rentals and commercial premises"
  ],
  propertyTypes: ["Homes", "Apartments", "Rental properties", "Shops", "Offices"]
};

const greenvaleOverrides: Partial<LocationConfig> = {
  nearbySuburbs: [
    "Attwood",
    "Bulla",
    "Craigieburn",
    "Meadow Heights",
    "Melbourne Airport",
    "Oaklands Junction",
    "Roxburgh Park",
    "Westmeadows",
    "Yuroke"
  ]
};
export const locations: LocationConfig[] = profiles.map((name) => {
  const location = name.replace(/^Grade A Plumb(?:er|ing) /, "");
  const slug = locationSlug(location);
  const base: LocationConfig = {
    name,
    location,
    slug,
    hostname: `${slug}.gradeaplumbing.store`,
    website: `https://${slug}.gradeaplumbing.store`,
    state: "VIC",
    tier: location === "Melbourne" ? 2 : 3,
    phone: "03 4421 6259",
    phoneHref: "tel:0344216259",
    nearbySuburbs: generatedNearbySuburbs[location] ?? [],
    address: storefronts[slug],
    googleBusinessProfile: googleBusinessProfiles[slug]
  };
  if (location === "Coburg") return { ...base, ...coburgOverrides };
  if (location === "Greenvale") return { ...base, ...greenvaleOverrides };
  return base;
});

export const defaultLocation = locations.find((item) => item.slug === "melbourne")!;

export function getLocationBySlug(slug?: string | null) {
  return locations.find((item) => item.slug === slug) ?? defaultLocation;
}

export function getLocationFromHost(host?: string | null) {
  const cleanHost = (host ?? "").split(":")[0].toLowerCase();
  const slug = cleanHost.endsWith(".gradeaplumbing.store") ? cleanHost.split(".")[0] : null;
  return getLocationBySlug(slug);
}



