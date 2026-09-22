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
  { service: "Emergency plumbing", path: "/emergency-plumbing-melbourne", copy: (s) => `A burst pipe, overflowing toilet or major leak can quickly damage a property. Grade A Plumbing provides emergency plumbing support in ${s}. If water is escaping, turn off the water supply when safe and contact us for the next step.` },
  { service: "Blocked drains", path: "/blocked-drains-melbourne", copy: (s) => `Slow drainage, unpleasant smells and gurgling fixtures can be early signs of a blockage. Grade A Plumbing helps homes and businesses in ${s} diagnose and clear blocked sinks, toilets, stormwater drains and sewer lines.` },
  { service: "Hot water repairs", path: "/hot-water-repairs-melbourne", copy: (s) => `No hot water, changing temperatures, unusual noises or a leaking unit should be checked promptly. Grade A Plumbing provides practical hot water fault finding and repairs across ${s}, with clear advice on repair or replacement options.` },
  { service: "Leaking taps and toilets", path: "/contact", copy: (s) => `A dripping tap or constantly running toilet can waste water and may worsen over time. Grade A Plumbing repairs leaking taps, toilets and fixtures for customers in ${s}. Request a quote and tell us what you have noticed.` },
  { service: "Commercial plumbing", path: "/commercial-plumbing-melbourne", copy: (s) => `Reliable plumbing matters when you are running a shop, office, cafe, warehouse or managed property. Grade A Plumbing supports commercial customers in ${s} with repairs, maintenance and urgent plumbing enquiries.` },
  { service: "Burst pipes", path: "/emergency-plumbing-melbourne", copy: (s) => `Wet walls, reduced water pressure or an unexplained increase in water use may point to a damaged pipe. Grade A Plumbing helps ${s} property owners assess leaking and burst pipes before the damage spreads.` },
  { service: "Kitchen and bathroom plumbing", path: "/contact", copy: (s) => `Planning a fixture repair or plumbing fit-off in ${s}? Grade A Plumbing works on sinks, mixers, toilets, showers, vanities, laundries and related pipework. Send a photo with your quote request to help us understand the job.` },
  { service: "Roof, gutter and stormwater plumbing", path: "/contact", copy: (s) => `Gutter leaks, poor stormwater flow and roof-plumbing faults can cause damage during heavy rain. Grade A Plumbing assists property owners in ${s} with roof, gutter and drainage plumbing enquiries.` },
  { service: "General plumbing maintenance", path: "/contact", copy: (s) => `Small plumbing problems are often easier to address before they become urgent. Grade A Plumbing provides general repairs and preventative plumbing maintenance for homes and businesses throughout ${s}.` },
  { service: "Plumbing inspection tip", path: "/contact", copy: (s) => `Noticed damp cabinetry, low pressure, water stains or a fixture that no longer works properly? These signs are worth investigating. Grade A Plumbing gives ${s} customers clear advice after assessing the plumbing issue.` }
];

export function getBrowserPostForDate(date) {
  if (!isIsoDate(date) || date < campaignStart || date > campaignEnd) return null;

  const dayIndex = daysBetween(campaignStart, date);
  const suburb = suburbs[dayIndex % suburbs.length];
  const campaign = campaigns[dayIndex % campaigns.length];

  return {
    date,
    service: campaign.service,
    suburb,
    summary: campaign.copy(suburb),
    url: `${website}${campaign.path}`
  };
}

export function getTodayInMelbourne() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Australia/Melbourne",
    year: "numeric"
  });
  return formatter.format(new Date());
}

function daysBetween(start, end) {
  return Math.floor((parseIsoDate(end).getTime() - parseIsoDate(start).getTime()) / 86_400_000);
}

function parseIsoDate(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && parseIsoDate(value).toISOString().slice(0, 10) === value;
}
