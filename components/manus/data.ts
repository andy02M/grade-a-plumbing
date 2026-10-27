import homepageData from "@/data/homepage-review-summary.json";
export const PHONE = "(02) 5837 5457";
export const PHONE_LINK = "tel:+61258375457";
export const EMAIL = "support@gradeaplumbing.store";

export type Service = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  image: string;
  route: string;
};

const asset = (name: string) => `/assets/${name}`;

export const services: Service[] = [
  {
    slug: "emergency-plumbing",
    title: "Emergency Plumbing",
    shortTitle: "Emergency Plumbing",
    description:
      "Urgent leaks, burst pipes, blocked drains and plumbing faults across Melbourne.",
    image: asset("sharp/02_Emergency_Plumbing_Service.jpg"),
    route: "/emergency-plumbing/",
  },
  {
    slug: "blocked-drains",
    title: "Blocked Drains",
    shortTitle: "Blocked Drains",
    description:
      "Practical assessment and clearing for blocked sinks, toilets, sewers and stormwater lines.",
    image: asset("sharp/03_Blocked_Drains.jpg"),
    route: "/blocked-drains/",
  },
  {
    slug: "hot-water-systems",
    title: "Hot Water Systems",
    shortTitle: "Hot Water Systems",
    description:
      "Repair, replacement and installation advice for hot water systems.",
    image: asset("sharp/04_Hot_Water_Systems.jpg"),
    route: "/hot-water-systems/",
  },
  {
    slug: "burst-pipe-repairs",
    title: "Burst Pipe Repairs",
    shortTitle: "Burst Pipe Repairs",
    description:
      "Fast isolation guidance and careful repair for burst or leaking pipework.",
    image: asset("sharp/05_Burst_Pipe_Repairs.jpg"),
    route: "/burst-pipe-repairs/",
  },
  {
    slug: "toilet-repairs",
    title: "Toilet Repairs",
    shortTitle: "Toilet Repairs",
    description: "Help with leaking, blocked, running or damaged toilets.",
    image: asset("sharp/06_Toilet_Repairs.jpg"),
    route: "/toilet-repairs/",
  },
  {
    slug: "gas-plumbing",
    title: "Gas Plumbing",
    shortTitle: "Gas Plumbing",
    description:
      "Enquiries for gas leaks, appliance connections and gas pipework.",
    image: asset("sharp/07_Gas_Plumbing.jpg"),
    route: "/gas-plumbing/",
  },
  {
    slug: "sewer-repairs",
    title: "Sewer Repairs",
    shortTitle: "Sewer Repairs",
    description:
      "Assessment for recurring blockages, damaged sewer lines and wastewater problems.",
    image: asset("sharp/08_Sewer_Repairs.jpg"),
    route: "/sewer-repairs/",
  },
  {
    slug: "pipe-relining",
    title: "Pipe Relining",
    shortTitle: "Pipe Relining",
    description:
      "Explore whether no-dig repair is suitable for cracked or damaged drains.",
    image: asset("sharp/09_Pipe_Relining.jpg"),
    route: "/pipe-relining/",
  },
  {
    slug: "kitchen-plumbing",
    title: "Kitchen Plumbing",
    shortTitle: "Kitchen Plumbing",
    description: "Kitchen sink, mixer, waste and under-bench plumbing support.",
    image: asset("sharp/10_Kitchen_Plumbing.jpg"),
    route: "/kitchen-plumbing/",
  },
  {
    slug: "bathroom-plumbing",
    title: "Bathroom Plumbing",
    shortTitle: "Bathroom Plumbing",
    description:
      "Bathroom fixtures, water connections, leaks and fit-off work.",
    image: asset("sharp/11_Bathroom_Plumbing.jpg"),
    route: "/bathroom-plumbing/",
  },
  {
    slug: "leak-detection",
    title: "Leak Detection",
    shortTitle: "Leak Detection",
    description:
      "Practical investigation of visible and suspected water leaks.",
    image: asset("sharp/12_Leak_Detection.jpg"),
    route: "/leak-detection/",
  },
  {
    slug: "commercial-plumbing",
    title: "Commercial Plumbing",
    shortTitle: "Commercial Plumbing",
    description:
      "Plumbing support for offices, shops, hospitality, facilities and managed properties.",
    image: asset("sharp/13_Commercial_Plumbing.jpg"),
    route: "/commercial-plumbing/",
  },
];

export const suburbs = [
  "West Melbourne",
  "Carlton",
  "Southbank",
  "Docklands",
  "South Wharf",
  "North Melbourne",
  "East Melbourne",
  "Fitzroy",
  "South Melbourne",
  "Collingwood",
  "Preston",
  "Coburg",
  "Reservoir",
  "Epping",
  "Footscray",
  "Sunshine",
  "St Albans",
  "Werribee",
  "Botanic Hill",
  "Doncaster",
  "Glen Waverley",
  "Ringwood",
  "Dandenong",
  "Moorabbin",
  "Cheltenham",
  "Frankston",
  "Richmond",
  "Brunswick",
  "Port Melbourne",
  "Hawthorn",
];

export const reviews = homepageData.reviews;

export const processSteps = [
  {
    number: "01",
    title: "Contact Us",
    body: "Call or send a quote request with your plumbing issue and location.",
  },
  {
    number: "02",
    title: "Assessment",
    body: "We gather the necessary details and arrange the appropriate next step.",
  },
  {
    number: "03",
    title: "Clear Pricing",
    body: "The work is assessed and pricing is explained before proceeding.",
  },
  {
    number: "04",
    title: "Work Completed",
    body: "The approved work is carried out, checked and explained.",
  },
];

export const gallery = [
  {
    title: "Bathroom shower",
    image: asset("project-photos/bathroom-shower.webp"),
    label: "Completed project",
    category: "Bathrooms",
    alt: "Bathroom shower with glass enclosure, tiled walls and wall-mounted fixtures.",
  },
  {
    title: "Bathroom vanity",
    image: asset("project-photos/bathroom-vanity.webp"),
    label: "Completed project",
    category: "Bathrooms",
    alt: "Bathroom vanity with vessel basin and mirrored cabinet.",
  },
  {
    title: "Built-in bath",
    image: asset("project-photos/built-in-bath.webp"),
    label: "Completed project",
    category: "Bathrooms",
    alt: "Built-in bathtub set into a tiled bathroom surround.",
  },
  {
    title: "Double bathroom vanity",
    image: asset("project-photos/double-vanity.webp"),
    label: "Completed project",
    category: "Bathrooms",
    alt: "Double vanity with two basins and illuminated mirrors.",
  },
  {
    title: "Hot water system",
    image: asset("project-photos/hot-water-system.webp"),
    label: "Completed project",
    category: "Hot water",
    alt: "Outdoor hot water cylinder and connected pipework.",
  },
  {
    title: "Kitchen cooktop",
    image: asset("project-photos/kitchen-cooktop.webp"),
    label: "Completed project",
    category: "Kitchens",
    alt: "Kitchen cooktop and oven installation.",
  },
  {
    title: "Kitchen sink",
    image: asset("project-photos/kitchen-sink.webp"),
    label: "Completed project",
    category: "Kitchens",
    alt: "Kitchen sink with mixer tap and stone benchtop.",
  },
  {
    title: "Walk-in shower",
    image: asset("project-photos/walk-in-shower.webp"),
    label: "Completed project",
    category: "Bathrooms",
    alt: "Walk-in shower with glass screen and rainfall shower fittings.",
  },
  {
    title: "Toilet and shower",
    image: asset("project-photos/toilet-and-shower.webp"),
    label: "Completed project",
    category: "Bathrooms",
    alt: "Bathroom with toilet and glass-enclosed shower.",
  },
  {
    title: "Bathroom shower suite",
    image: asset("project-photos/shower-suite.webp"),
    label: "Completed project",
    category: "Bathrooms",
    alt: "Compact bathroom with shower enclosure and toilet.",
  },
  {
    title: "Drainage works",
    image: asset("project-photos/drainage-trench.webp"),
    label: "Completed project",
    category: "Drainage",
    alt: "Open trench prepared for drainage pipework.",
  },
  {
    title: "Roof drainage",
    image: asset("project-photos/roof-drainage.webp"),
    label: "Completed project",
    category: "Roof and drainage",
    alt: "Roof edge and drainage detail on a tiled-roof property.",
  },
  {
    title: "Freestanding bathtub",
    image: asset("project-photos/freestanding-bath.webp"),
    label: "Completed project",
    category: "Bathrooms",
    alt: "Freestanding bathtub in a tiled bathroom.",
  },
  {
    title: "Shower and toilet",
    image: asset("project-photos/shower-toilet-renovation.webp"),
    label: "Completed project",
    category: "Bathrooms",
    alt: "Shower and toilet fixtures in a tiled bathroom.",
  },
  {
    title: "Hot water pipework",
    image: asset("project-photos/hot-water-pipework.webp"),
    label: "Completed project",
    category: "Hot water",
    alt: "Exposed hot water unit connections and pipework.",
  },
  {
    title: "Plumbing pipework",
    image: asset("project-photos/plumbing-pipework.webp"),
    label: "Completed project",
    category: "Pipework",
    alt: "Close-up of plumbing pipework and fittings.",
  },
  {
    title: "Tiled shower",
    image: asset("project-photos/tiled-shower.webp"),
    label: "Completed project",
    category: "Bathrooms",
    alt: "Tiled shower with recessed shelf and glass enclosure.",
  },
  {
    title: "Bathroom vanity and toilet",
    image: asset("project-photos/bathroom-vanity-toilet.webp"),
    label: "Completed project",
    category: "Bathrooms",
    alt: "Bathroom vanity, basin and toilet fixtures.",
  },
];

export const routeCopy: Record<
  string,
  { eyebrow: string; title: string; body: string }
> = {
  "/about-us/": {
    eyebrow: "ABOUT GRADE A",
    title: "Practical plumbing help for Melbourne properties.",
    body: "From the first call through to the final check, our focus is clear communication, careful work and a sensible next step for the problem in front of us.",
  },
  "/services/": {
    eyebrow: "WHAT WE OFFER",
    title: "Plumbing services in Melbourne.",
    body: "Dedicated service pathways explain the problems we help with, the likely next steps and related plumbing options.",
  },
  "/emergency-plumber/": {
    eyebrow: "EMERGENCY PLUMBING · MELBOURNE",
    title: "When it cannot wait, call a plumber.",
    body: "Urgent leaks, burst pipes, blocked drains and plumbing faults need a calm next step. Call first so we can discuss the available response.",
  },
  "/blocked-drains/": {
    eyebrow: "BLOCKED DRAINS · MELBOURNE",
    title: "Blocked drain plumber in Melbourne.",
    body: "Slow drains, gurgling pipes, unpleasant smells and overflows can all point to a blockage. We help identify the likely cause and restore flow.",
  },
  "/hot-water-systems/": {
    eyebrow: "HOT WATER · MELBOURNE",
    title: "Hot water plumber in Melbourne.",
    body: "No hot water, leaking equipment, low pressure or inconsistent temperature can disrupt the whole property.",
  },
  "/hot-water/": {
    eyebrow: "HOT WATER · MELBOURNE",
    title: "Hot water plumber in Melbourne.",
    body: "No hot water, leaking equipment, low pressure or inconsistent temperature can disrupt the whole property.",
  },
  "/burst-pipe-repairs/": {
    eyebrow: "BURST PIPE REPAIR · MELBOURNE",
    title: "Burst or leaking pipe? Start with the right assessment.",
    body: "Call for isolation guidance, an explanation of the likely issue and a clear next step for repair.",
  },
  "/burst-pipe-repair/": {
    eyebrow: "BURST PIPE REPAIR · MELBOURNE",
    title: "Burst or leaking pipe? Start with the right assessment.",
    body: "Call for isolation guidance, an explanation of the likely issue and a clear next step for repair.",
  },
  "/toilet-repairs/": {
    eyebrow: "TOILET REPAIRS · MELBOURNE",
    title: "Toilet repairs without the runaround.",
    body: "We help with blocked, leaking, running or damaged toilets across Melbourne properties.",
  },
  "/gas-plumbing/": {
    eyebrow: "GAS PLUMBING · MELBOURNE",
    title: "Gas plumbing with a clear next step.",
    body: "Contact Grade A Plumbing about gas leaks, appliance connections and gas pipework.",
  },
  "/sewer-repairs/": {
    eyebrow: "SEWER REPAIRS · MELBOURNE",
    title: "Sewer repair assessment for Melbourne properties.",
    body: "Recurring blockages, damaged sewer lines and wastewater problems need evidence-led assessment.",
  },
  "/pipe-relining/": {
    eyebrow: "PIPE RELINING · MELBOURNE",
    title: "Explore whether no-dig pipe repair is suitable.",
    body: "Pipe relining can be an option for some cracked or damaged drains after assessment.",
  },
  "/commercial-plumbing/": {
    eyebrow: "COMMERCIAL PLUMBING · MELBOURNE",
    title: "Commercial plumbing for managed properties.",
    body: "Support for offices, shops, hospitality, facilities and commercial property teams.",
  },
  "/our-work/": {
    eyebrow: "OUR WORK",
    title: "Real work. Real results.",
    body: "Browse completed Grade A Plumbing projects across bathroom, kitchen, hot water, drainage and pipework services.",
  },
  "/reviews/": {
    eyebrow: "CUSTOMER REVIEWS",
    title: "What our customers say.",
    body: "Read genuine review excerpts from customers on Google. Select the source profile to read the full review.",
  },
  "/service-areas/": {
    eyebrow: "SERVICE AREA",
    title: "Local plumbing help across Melbourne.",
    body: "We provide plumbing services throughout Melbourne and surrounding suburbs. Contact us with your address to confirm current availability.",
  },
  "/contact-us/": {
    eyebrow: "CONTACT GRADE A",
    title: "Request plumbing service in Melbourne.",
    body: "Tell us what you need, your suburb and the best way to reach you. For urgent problems, call first.",
  },
  "/contact/": {
    eyebrow: "CONTACT GRADE A",
    title: "Request plumbing service in Melbourne.",
    body: "Tell us what you need, your suburb and the best way to reach you. For urgent problems, call first.",
  },
};
