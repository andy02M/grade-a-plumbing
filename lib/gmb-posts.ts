export type GmbPost = {
  callToAction: { actionType: "LEARN_MORE"; url: string };
  date: string;
  service: string;
  suburb: string;
  summary: string;
  topicType: "STANDARD";
};

const campaignStart = "2026-09-13";
const campaignEnd = "2026-12-31";
const website = "https://www.gradeaplumbing.store";

const suburbs = [
  "Melbourne CBD", "St Albans", "South Melbourne", "Pakenham", "Ballarat Central", "Bendigo", "Geelong",
  "Melton", "Point Cook", "Reservoir", "Richmond", "St Kilda", "Epping", "Footscray", "Glen Waverley",
  "Fitzroy", "Box Hill", "Hawthorn", "Essendon", "Ringwood", "Brighton", "Narre Warren", "Mornington",
  "Brunswick", "Dandenong", "Frankston", "Kew", "Caroline Springs", "Williamstown", "Kensington", "Blackburn",
  "Thornbury", "Craigieburn", "North Melbourne", "Berwick", "Hoppers Crossing", "Altona", "Bentleigh", "Moorabbin",
  "Bundoora", "Preston", "Doncaster", "Northcote", "Coburg", "Cremorne", "Werribee", "Camberwell", "Sunbury",
  "Sunshine", "Port Melbourne", "Balwyn", "Carlton", "Tarneit", "Cheltenham", "Newport", "Templestowe", "Hampton",
  "Lalor", "Mill Park", "Bulleen", "Malvern", "Prahran", "Mont Albert", "Burwood", "Springvale", "Clifton Hill",
  "Deanside", "Mount Waverley", "Strathmore", "Thomastown", "Toorak", "Chadstone", "Cranbourne", "Wantirna",
  "Bayswater", "Greenvale"
];

const campaigns = [
  { service: "Emergency plumbing", path: "/emergency-plumbing-melbourne", copy: (s: string) => `A burst pipe, overflowing toilet or major leak can quickly damage a property. Grade A Plumbing provides emergency plumbing support in ${s}. If water is escaping, turn off the water supply when safe and contact us for the next step.` },
  { service: "Blocked drains", path: "/blocked-drains-melbourne", copy: (s: string) => `Slow drainage, unpleasant smells and gurgling fixtures can be early signs of a blockage. Grade A Plumbing helps homes and businesses in ${s} diagnose and clear blocked sinks, toilets, stormwater drains and sewer lines.` },
  { service: "Hot water repairs", path: "/hot-water-repairs-melbourne", copy: (s: string) => `No hot water, changing temperatures, unusual noises or a leaking unit should be checked promptly. Grade A Plumbing provides practical hot water fault finding and repairs across ${s}, with clear advice on repair or replacement options.` },
  { service: "Leaking taps and toilets", path: "/contact", copy: (s: string) => `A dripping tap or constantly running toilet can waste water and may worsen over time. Grade A Plumbing repairs leaking taps, toilets and fixtures for customers in ${s}. Request a quote and tell us what you have noticed.` },
  { service: "Commercial plumbing", path: "/commercial-plumbing-melbourne", copy: (s: string) => `Reliable plumbing matters when you are running a shop, office, cafe, warehouse or managed property. Grade A Plumbing supports commercial customers in ${s} with repairs, maintenance and urgent plumbing enquiries.` },
  { service: "Burst pipes", path: "/emergency-plumbing-melbourne", copy: (s: string) => `Wet walls, reduced water pressure or an unexplained increase in water use may point to a damaged pipe. Grade A Plumbing helps ${s} property owners assess leaking and burst pipes before the damage spreads.` },
  { service: "Kitchen and bathroom plumbing", path: "/contact", copy: (s: string) => `Planning a fixture repair or plumbing fit-off in ${s}? Grade A Plumbing works on sinks, mixers, toilets, showers, vanities, laundries and related pipework. Send a photo with your quote request to help us understand the job.` },
  { service: "Roof, gutter and stormwater plumbing", path: "/contact", copy: (s: string) => `Gutter leaks, poor stormwater flow and roof-plumbing faults can cause damage during heavy rain. Grade A Plumbing assists property owners in ${s} with roof, gutter and drainage plumbing enquiries.` },
  { service: "General plumbing maintenance", path: "/contact", copy: (s: string) => `Small plumbing problems are often easier to address before they become urgent. Grade A Plumbing provides general repairs and preventative plumbing maintenance for homes and businesses throughout ${s}.` },
  { service: "Plumbing inspection tip", path: "/contact", copy: (s: string) => `Noticed damp cabinetry, low pressure, water stains or a fixture that no longer works properly? These signs are worth investigating. Grade A Plumbing gives ${s} customers clear advice after assessing the plumbing issue.` }
];

export function getGmbCampaignDates() {
  return { end: campaignEnd, start: campaignStart };
}

export function getGmbPostForDate(date: string): GmbPost | null {
  if (!isIsoDate(date) || date < campaignStart || date > campaignEnd) return null;

  const dayIndex = daysBetween(campaignStart, date);
  const suburb = suburbs[dayIndex % suburbs.length];
  const campaign = campaigns[dayIndex % campaigns.length];

  return {
    callToAction: { actionType: "LEARN_MORE", url: `${website}${campaign.path}` },
    date,
    service: campaign.service,
    suburb,
    summary: campaign.copy(suburb),
    topicType: "STANDARD"
  };
}

export function getGmbCampaignPosts() {
  const posts: GmbPost[] = [];
  const date = parseIsoDate(campaignStart);
  const end = parseIsoDate(campaignEnd);

  while (date <= end) {
    const post = getGmbPostForDate(formatUtcDate(date));
    if (post) posts.push(post);
    date.setUTCDate(date.getUTCDate() + 1);
  }

  return posts;
}

function daysBetween(start: string, end: string) {
  return Math.floor((parseIsoDate(end).getTime() - parseIsoDate(start).getTime()) / 86_400_000);
}

function parseIsoDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && formatUtcDate(parseIsoDate(value)) === value;
}
