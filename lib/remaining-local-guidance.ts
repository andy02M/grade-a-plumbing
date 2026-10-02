import rows from "@/data/remaining-local-guidance.json";
import type { LocalGuidance } from "./local-guidance";

// Authority information describes property requirements, not storefront verification.
const sourceUrls: Record<string, string> = {
 melbourne: "https://participate.melbourne.vic.gov.au/flood-mapping/project-overview",
 brimbank: "https://www.brimbank.vic.gov.au/doing-business/building-and-development/roads-and-drainage/stormwater-connection-council-pit-or-pipe",
 portphillip: "https://www.portphillip.vic.gov.au/planning-and-building/building-and-construction/stormwater-discharge-point-drainage",
 cardinia: "https://www.cardinia.vic.gov.au/services/parking-roads-and-traffic/stormwater-and-drainage",
 ballarat: "https://www.ballarat.vic.gov.au/city/roads-and-drains/stormwater-and-drains",
 bendigo: "https://www.bendigo.vic.gov.au/forms/property-information-request",
 geelong: "https://yoursay.geelongaustralia.com.au/stormwater/faqs-and-key-terms",
 melton: "https://www.melton.vic.gov.au/Services/Building-Planning-Transport/Engineering/Engineering-applications",
 wyndham: "https://www.wyndham.vic.gov.au/services/building/other-related-permits-and-applications/apply-legal-point-discharge-information",
 darebin: "https://www.darebin.vic.gov.au/Planning-and-building/Building-and-renovations/Building-step-1-gather-information/Types-of-building-permits/Non-building-applications-and-permits/Stormwater-legal-point-of-discharge",
 whittlesea: "https://www.whittlesea.vic.gov.au/Environment/Flooding-stormwater-and-rainwater/Stormwater-drainage-design-and-discharge",
 maribyrnong: "https://www.maribyrnong.vic.gov.au/Building-and-Planning/Forms-and-Checklists",
 boroondara: "https://www.boroondara.vic.gov.au/services/planning-and-building/building/works-permits/stormwater/legal-point-discharge",
 mooneevalley: "https://mvcc.vic.gov.au/work/my-development/footpaths-roads-drains-permits/",
 maroondah: "https://www.maroondah.vic.gov.au/Development/Roads-footpaths-and-drains/Drainage-and-stormwater",
 bayside: "https://ablis.business.gov.au/service/vic/drainage-tapping-permit/26934",
 casey: "https://www.casey.vic.gov.au/apply-legal-point-of-discharge-report",
 merribekpermits: "https://www.merri-bek.vic.gov.au/building-and-business/planning-and-building/building/Other-construction-permits/",
 dandenong: "https://www.greaterdandenong.vic.gov.au/water-and-stormwater/stormwater-drains",
 frankston: "https://www.frankston.vic.gov.au/Planning-and-Building/Roads-and-Infrastructure/Infrastructure-permits-and-applications/Request-location-of-a-stormwater-discharge-point",
 gleneira: "https://www.gleneira.vic.gov.au/services/planning-and-building/building/point-of-discharge-report",
 merribek: "https://www.merri-bek.vic.gov.au/living-in-merri-bek/parking-and-roads/roads-footpaths-drains-and-lighting/stormwater-drains-and-sewerage/",
 yarra: "https://www.yarracity.vic.gov.au/planning-and-building/building-yarra/building-permits-and-inspections/road-footpath-opening",
 kingston: "https://www.kingston.vic.gov.au/property/property-management/drains-and-stormwater/stormwater-requirements-for-developers",
 hobsonsbay: "https://www.hobsonsbay.vic.gov.au/Services/Roads-and-transport/Stormwater-drainage",
 manningham: "https://yoursay.manningham.vic.gov.au/flood-and-water-management/widgets/365752/faqs",
 stonnington: "https://www.stonnington.vic.gov.au/Planning-and-building/Building/Building-and-property-information/Stormwater-outlets",
 whitehorse: "https://www.whitehorse.vic.gov.au/planning-building/do-i-need-permit/drainage-and-easements",
 monash: "https://www.monash.vic.gov.au/Planning-Development/Building/Do-I-Need-a-Building-Permit/Rainwater-Tanks",
 monashdrains: "https://www.monash.vic.gov.au/Parking-Streets-Footpaths/Stormwater-Drains",
 knox: "https://www.knox.vic.gov.au/our-services/roads-streets-footpaths-and-drains/stormwater-drainage-and-services/stormwater-information-report",
 hume: "https://www.hume.vic.gov.au/Building-and-Planning/Building-and-Renovations/Stormwater-Connection-Points-and-Drainage-Asset-Details",
};

export const remainingLocalGuidance: Record<string, LocalGuidance> = {};
for (const row of rows) {
 if (row.length !== 8 || row.some(value => typeof value !== "string" || !value.trim())) throw new Error("Invalid local guidance row");
 const [slug, sourceKey, heading, introduction, fact, preparation, question, answer] = row;
 const url = sourceUrls[sourceKey];
 if (!url || remainingLocalGuidance[slug]) throw new Error(`Invalid or duplicate guidance: ${slug}`);
 const description = introduction.length <= 190 ? introduction : introduction.slice(0, 187).replace(/\s+\S*$/, "") + "…";
 remainingLocalGuidance[slug] = {
  heading, introduction, metaDescription: description, checkedDate: "2026-10-02",
  paragraphs: [fact, preparation],
  faqs: [{ question, answer }, { question: `What information helps me ${heading.charAt(0).toLowerCase() + heading.slice(1)}?`, answer: preparation }],
  relatedServices: ["blocked-drains", "sewer-repairs"],
  sources: [{ title: `Official property guidance: ${url.split("/")[2]}`, url }],
 };
}
