const whatsAppNumber = "61435901660";
const whatsAppMessage = "Hi Grade A Plumbing, I need help with a plumbing issue in Melbourne.";

export const site = {
  name: "Grade A Plumbing",
  baseUrl: "https://gradeaplumbing.com.au",
  phone: "03 4421 6259",
  phoneHref: "tel:0344216259",
  email: "support@gradeaplumbing.store",
  emailHref: "mailto:support@gradeaplumbing.store",
  whatsAppNumber,
  whatsAppHref: `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(whatsAppMessage)}`,
  calendlyUrl: "https://calendly.com/gradeaplumbing-support/30min",
  calendlyEmbedUrl:
    "https://calendly.com/gradeaplumbing-support/30min?hide_event_type_details=1&hide_gdpr_banner=1",
  serviceArea: "Melbourne VIC, St Kilda, South Melbourne, Richmond, and surrounding suburbs",
  location: "Melbourne, Victoria, Australia",
  description:
    "Fast, reliable plumbing services across Melbourne, St Kilda, South Melbourne, Richmond, and surrounding suburbs for homes, businesses, and emergency callouts."
} as const;

export const brandAssets = {
  logo: {
    src: "/grade-a-logo.png",
    width: 1192,
    height: 1319,
    alt: "Grade A Plumbing logo"
  },
  heroBanner: {
    src: "/grade-a-hero-banner.png",
    width: 1672,
    height: 941,
    alt: "Grade A Plumbing branded van and plumber outside a home"
  },
  team: {
    src: "/grade-a-team.png",
    width: 1083,
    height: 1452,
    alt: "Grade A Plumbing team standing in front of the company service truck"
  },
  landscapePlumber: {
    src: "/grade-a-plumber-landscape.png",
    width: 1448,
    height: 1086,
    alt: "Grade A Plumbing plumber standing outdoors overlooking a suburban landscape"
  },
  repairWork: {
    src: "/grade-a-repair-work.png",
    width: 1454,
    height: 1082,
    alt: "Grade A Plumbing plumber carrying out repair work inside a framed wall cavity"
  },
  homeVisit: {
    src: "/grade-a-home-visit.png",
    width: 1468,
    height: 1071,
    alt: "Grade A Plumbing plumber arriving at a home for a service visit"
  },
  serviceVan: {
    src: "/grade-a-service-van.png",
    width: 1456,
    height: 1080,
    alt: "Grade A Plumbing service van parked outside a property"
  }
} as const;

export const recentWorkItems = [
  {
    title: "Kitchen sink mixer installation",
    category: "Kitchen plumbing",
    description:
      "Double-bowl stainless sink with a tall mixer installed beneath the kitchen window.",
    aspectClass: "aspect-[16/10]",
    image: {
      src: "/work-showcase/kitchen-sink-mixer-upgrade.webp",
      alt: "Double-bowl stainless steel kitchen sink with a tall mixer tap beneath a large window"
    }
  },
  {
    title: "Vulcan hot water unit in side passage",
    category: "Hot water",
    description:
      "Outdoor Vulcan hot water unit set in a narrow brick side passage with visible copper connections.",
    aspectClass: "aspect-[4/5]",
    image: {
      src: "/work-showcase/bathroom-vanity-basin-fitoff.webp",
      alt: "Vulcan outdoor hot water unit in a narrow brick side passage with copper pipework"
    }
  },
  {
    title: "Vanity, basin and mirror cabinet fit-off",
    category: "Bathroom plumbing",
    description:
      "Modern vanity fit-off with round basin, tall mixer, mirrored storage, and laundry space.",
    aspectClass: "aspect-[4/5]",
    image: {
      src: "/work-showcase/walk-in-shower-fitoff.webp",
      alt: "Bathroom vanity with round basin, tall mixer tap, mirrored cabinet, and washing machine space"
    }
  },
  {
    title: "Under-sink waste and isolation valves",
    category: "Kitchen plumbing",
    description:
      "Close-up of under-bench sink plumbing with a white PVC trap, waste line, and isolation valves.",
    aspectClass: "aspect-[4/5]",
    image: {
      src: "/work-showcase/double-bowl-kitchen-sink-install.webp",
      alt: "Under-sink plumbing with white PVC trap, waste pipe, and hot and cold isolation valves"
    }
  },
  {
    title: "Thermann external hot water system",
    category: "Hot water",
    description:
      "External Thermann storage hot water unit against a red brick wall with insulated pipework.",
    aspectClass: "aspect-[4/5]",
    image: {
      src: "/work-showcase/under-vanity-plumbing-fitoff.webp",
      alt: "Thermann external hot water system against a red brick wall with insulated pipework"
    }
  },
  {
    title: "Hot water system upgrade",
    category: "Hot water",
    description:
      "Outdoor hot water upgrade with new copper connections and a stable concrete base.",
    aspectClass: "aspect-[4/5]",
    image: {
      src: "/work-showcase/hot-water-system-upgrade.png",
      alt: "Large outdoor hot water system installed beside a brick wall with new copper pipework"
    }
  },
  {
    title: "Wall-mounted Thermann gas hot water unit",
    category: "Hot water",
    description:
      "Wall-mounted Thermann natural gas continuous-flow unit with insulated pipework on an external wall.",
    aspectClass: "aspect-[4/5]",
    image: {
      src: "/work-showcase/hot-water-system-wall-install.png",
      alt: "Wall-mounted Thermann natural gas hot water unit with insulated pipework on an external wall"
    }
  },
  {
    title: "Double-bowl kitchen sink and chrome mixer",
    category: "Kitchen plumbing",
    description:
      "Double-bowl stainless sink set into a white stone-look benchtop with a chrome gooseneck mixer.",
    aspectClass: "aspect-[4/5]",
    image: {
      src: "/work-showcase/vulcan-hot-water-system-side.webp",
      alt: "Double-bowl stainless steel kitchen sink with a chrome mixer on a white benchtop"
    }
  },
  {
    title: "Bathroom vanity and shower fit-off",
    category: "Bathroom plumbing",
    description:
      "Bathroom fit-off showing a round basin, mirrored cabinet, rain shower, handheld shower, and floor waste.",
    aspectClass: "aspect-[4/5]",
    image: {
      src: "/work-showcase/vulcan-hot-water-system-front.webp",
      alt: "Bathroom vanity, round basin, mirrored cabinet, and shower with rain head and handheld shower"
    }
  },
  {
    title: "Vulcan hot water service connections",
    category: "Hot water",
    description:
      "Front view of a Vulcan outdoor hot water system with insulated pipework, copper lines, and service valves.",
    aspectClass: "aspect-[4/5]",
    image: {
      src: "/work-showcase/thermann-hot-water-system-install.webp",
      alt: "Vulcan outdoor hot water system with insulated pipework and copper connections against a brick wall"
    }
  },
  {
    title: "Handheld shower rail and hose",
    category: "Bathroom plumbing",
    description:
      "Chrome handheld shower set installed on a tiled shower wall with adjustable rail and hose.",
    aspectClass: "aspect-[4/5]",
    image: {
      src: "/work-showcase/handheld-shower-install.png",
      alt: "Chrome handheld shower head and rail installed against a tiled shower wall"
    }
  },
  {
    title: "Wall-mounted rainfall shower head",
    category: "Bathroom plumbing",
    description:
      "Large chrome rainfall shower head installed on a white tiled wall with a clean finish.",
    aspectClass: "aspect-[4/5]",
    image: {
      src: "/work-showcase/rainfall-shower-head-install.png",
      alt: "Large rainfall shower head installed on a white tiled bathroom wall"
    }
  },
  {
    title: "Toilet suite installation",
    category: "Toilet plumbing",
    description:
      "White toilet suite installed in a residential bathroom beside the bath and shower screen.",
    aspectClass: "aspect-[4/5]",
    image: {
      src: "/work-showcase/toilet-install-bathroom.png",
      alt: "White toilet installed in a residential bathroom next to a bathtub and vanity"
    }
  },
  {
    title: "Close-coupled toilet upgrade",
    category: "Toilet plumbing",
    description:
      "Close-coupled white toilet suite installed against grey wall tiles and dark floor tiles.",
    aspectClass: "aspect-[4/5]",
    image: {
      src: "/work-showcase/close-coupled-toilet-upgrade.png",
      alt: "New close-coupled white toilet installed against grey wall tiles and dark floor tiles"
    }
  },
  {
    title: "External drain connection detail",
    category: "Drainage",
    description:
      "White PVC drainage pipe routed neatly into an external grated floor waste.",
    aspectClass: "aspect-[4/5]",
    image: {
      src: "/work-showcase/drain-connection-detail.png",
      alt: "White drainage pipe connected neatly into an external floor waste drain against tiled paving"
    }
  }
] as const;

export const primarySeoAreas = [
  "Melbourne CBD",
  "St Kilda",
  "South Melbourne",
  "Richmond"
] as const;

export const coreServiceLocations = [
  {
    suburb: "Melbourne CBD",
    title: "Plumber Melbourne CBD",
    description:
      "Need a plumber in Melbourne CBD? Grade A Plumbing helps apartments, offices, retail sites, hospitality venues, and city businesses with emergency plumbing, blocked drains, hot water repairs, leaks, and general maintenance.",
    searchFocus:
      "Popular searches include plumber Melbourne, emergency plumber Melbourne, blocked drains Melbourne, and hot water plumber Melbourne."
  },
  {
    suburb: "St Kilda",
    title: "Plumber St Kilda",
    description:
      "Looking for a plumber in St Kilda? We service homes, apartments, cafes, shops, and hospitality venues for blocked drains, leaking toilets, hot water faults, burst pipes, and urgent plumbing callouts.",
    searchFocus:
      "Popular searches include plumber St Kilda, emergency plumber St Kilda, blocked drains St Kilda, and hot water plumber St Kilda."
  },
  {
    suburb: "South Melbourne",
    title: "Plumber South Melbourne",
    description:
      "Searching for a plumber in South Melbourne? Grade A Plumbing supports homes, terraces, offices, shops, and mixed-use properties with emergency plumbing, blocked drains, hot water repairs, leaks, and maintenance.",
    searchFocus:
      "Popular searches include plumber South Melbourne, emergency plumber South Melbourne, blocked drains South Melbourne, and hot water repairs South Melbourne."
  },
  {
    suburb: "Richmond",
    title: "Plumber Richmond VIC",
    description:
      "Need a plumber in Richmond VIC? We help Richmond homes, apartments, retail sites, and commercial spaces with blocked drains, hot water repairs, emergency plumbing, burst pipes, leaks, and general plumbing work.",
    searchFocus:
      "Popular searches include plumber Richmond, emergency plumber Richmond, blocked drains Richmond, and hot water plumber Richmond."
  }
] as const;

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Emergency Plumbing", href: "/emergency-plumbing-melbourne" },
  { label: "Blocked Drains", href: "/blocked-drains-melbourne" },
  { label: "Hot Water", href: "/hot-water-repairs-melbourne" },
  { label: "Commercial Plumbing", href: "/commercial-plumbing-melbourne" },
  { label: "Service Areas", href: "/service-areas" },
  { label: "Contact", href: "/contact" }
] as const;

export const primaryServices = [
  {
    title: "Emergency Plumbing Melbourne",
    href: "/emergency-plumbing-melbourne",
    icon: "alert",
    description:
      "Urgent help for burst pipes, major leaks, blocked toilets, drainage issues, and hot water problems."
  },
  {
    title: "Blocked Drains",
    href: "/blocked-drains-melbourne",
    icon: "drain",
    description:
      "Drain plumbing support for blocked sinks, toilets, stormwater, sewer lines, and slow draining pipes."
  },
  {
    title: "Hot Water Repairs",
    href: "/hot-water-repairs-melbourne",
    icon: "water",
    description:
      "Practical help with no hot water, leaking units, pressure issues, odd noises, and temperature faults."
  },
  {
    title: "Commercial Plumbing",
    href: "/commercial-plumbing-melbourne",
    icon: "building",
    description:
      "Plumbing services for shops, offices, cafes, warehouses, property managers, and local businesses."
  },
  {
    title: "Leaking Taps and Toilets",
    href: "/contact",
    icon: "tap",
    description:
      "Repairs for dripping taps, running toilets, leaking fixtures, and water waste around the property."
  },
  {
    title: "Burst Pipes",
    href: "/emergency-plumbing-melbourne",
    icon: "pipe",
    description:
      "Prompt support for damaged, cracked, or burst pipes before the problem spreads further."
  },
  {
    title: "Gas Plumbing",
    href: "/contact",
    icon: "flame",
    description:
      "Gas plumbing enquiries handled with clear advice and appropriate compliance details before work begins."
  },
  {
    title: "Roof and Gutter Plumbing",
    href: "/contact",
    icon: "roof",
    description:
      "Help with roof plumbing, gutter leaks, stormwater flow, and drainage around Melbourne properties."
  },
  {
    title: "Bathroom and Kitchen Plumbing",
    href: "/contact",
    icon: "home",
    description:
      "Fixture, pipework, tap, sink, toilet, shower, laundry, bathroom, and kitchen plumbing support."
  },
  {
    title: "General Plumbing Maintenance",
    href: "/contact",
    icon: "wrench",
    description:
      "Maintenance plumbing for everyday repairs, property upkeep, and preventative checks."
  }
] as const;

export const suburbGroups = [
  {
    region: "Inner Melbourne",
    suburbs: [
      "Melbourne CBD",
      "South Melbourne",
      "Port Melbourne",
      "Richmond",
      "Brunswick",
      "St Kilda",
      "South Yarra",
      "Footscray",
      "Carlton",
      "Fitzroy",
      "Collingwood"
    ]
  },
  {
    region: "North Melbourne",
    suburbs: [
      "Preston",
      "Coburg",
      "Reservoir",
      "Epping",
      "Craigieburn",
      "Mickleham",
      "Thomastown",
      "Bundoora"
    ]
  },
  {
    region: "West Melbourne",
    suburbs: [
      "Werribee",
      "Tarneit",
      "Truganina",
      "Point Cook",
      "Sunshine",
      "Melton",
      "Hoppers Crossing",
      "Wyndham Vale"
    ]
  },
  {
    region: "East Melbourne",
    suburbs: [
      "Box Hill",
      "Ringwood",
      "Doncaster",
      "Glen Waverley",
      "Burwood",
      "Blackburn",
      "Mitcham"
    ]
  },
  {
    region: "South East Melbourne",
    suburbs: [
      "Dandenong",
      "Clayton",
      "Moorabbin",
      "Frankston",
      "Cranbourne",
      "Clyde North",
      "Pakenham",
      "Officer"
    ]
  }
] as const;

export const homepageFaqs = [
  {
    question: "How fast can a plumber arrive in Melbourne?",
    answer:
      "Response times depend on your suburb, traffic, current bookings, and the urgency of the plumbing issue. Call Grade A Plumbing on 03 4421 6259 and we will give you the clearest available timing."
  },
  {
    question: "Do you offer emergency plumbing?",
    answer:
      "Yes. Grade A Plumbing can help with emergency plumbing enquiries across Melbourne, including burst pipes, major leaks, blocked toilets, blocked drains, and urgent hot water issues."
  },
  {
    question: "Do you service commercial properties?",
    answer:
      "Yes. We work with Melbourne businesses, offices, shops, cafes, warehouses, property managers, and commercial sites that need reliable plumbing support."
  },
  {
    question: "Can you fix blocked drains?",
    answer:
      "Yes. We help diagnose and clear blocked drains, including blocked toilets, sinks, stormwater drains, sewer lines, and slow draining pipes."
  },
  {
    question: "Do you repair hot water systems?",
    answer:
      "Yes. We can help with no hot water, leaking units, low pressure, noisy systems, and temperature issues. If replacement is more sensible, we will explain your options clearly."
  },
  {
    question: "Do you provide upfront quotes?",
    answer:
      "Yes. We aim to provide clear pricing before work begins wherever the issue can be properly assessed. Some hidden or complex plumbing faults may need further investigation first."
  },
  {
    question: "What areas of Melbourne do you service?",
    answer:
      "Grade A Plumbing services Melbourne VIC and surrounding suburbs, including Melbourne CBD, St Kilda, South Melbourne, Richmond, and suburbs across inner, north, west, east, and south east Melbourne. If your suburb is not listed, contact us to check availability."
  },
  {
    question: "Do you service Melbourne CBD, St Kilda, South Melbourne, and Richmond?",
    answer:
      "Yes. Grade A Plumbing services Melbourne CBD and inner suburbs including St Kilda, South Melbourne, and Richmond for emergency plumbing, blocked drains, hot water repairs, commercial plumbing, and general maintenance."
  }
] as const;

export const whyChooseUs = [
  "Fast response across Melbourne",
  "Clean and respectful service",
  "Honest advice",
  "Clear communication",
  "Upfront pricing",
  "Quality workmanship"
] as const;

export const trustBadges = [
  "Melbourne based plumbers",
  "Emergency plumbing available",
  "Residential and commercial",
  "Upfront quotes",
  "Licence details available on request"
] as const;

export const processSteps = [
  {
    title: "Call or request a quote",
    text: "Tell us what is happening, where you are in Melbourne, and how urgent the issue is."
  },
  {
    title: "We assess the plumbing issue",
    text: "We inspect the fault, ask the right questions, and explain the likely cause in plain English."
  },
  {
    title: "You receive clear pricing",
    text: "You get clear pricing before the job proceeds wherever the issue can be properly scoped."
  },
  {
    title: "We complete the job properly",
    text: "We carry out the work with care, clean up, and explain what was done before leaving."
  }
] as const;

export type FaqItem = {
  question: string;
  answer: string;
};

export type BreadcrumbItem = {
  name: string;
  href: string;
};
