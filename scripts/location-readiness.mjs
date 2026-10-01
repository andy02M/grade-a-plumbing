import { readFileSync } from "node:fs";
import { resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const cache = new Map();
// Load configuration only, without a Next server or environment credentials.
function loadConfig(filename) {
  if (cache.has(filename)) return cache.get(filename);
  if (extname(filename) === ".json") return JSON.parse(readFileSync(filename, "utf8"));
  const module = { exports: {} };
  cache.set(filename, module.exports);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  runInNewContext(source, {
    module, exports: module.exports,
    require(specifier) {
      if (!specifier.startsWith(".") && !specifier.startsWith("@/")) throw new Error(`Non-config import: ${specifier}`);
      const target = specifier.startsWith("@/") ? resolve(root, specifier.slice(2)) : resolve(dirname(filename), specifier);
      return loadConfig(extname(target) ? target : `${target}.ts`);
    },
  });
  return module.exports;
}

export function locationReadiness() {
  const { locations } = loadConfig(resolve(root, "lib/locations.ts"));
  const { localGuidance } = loadConfig(resolve(root, "lib/local-guidance.ts"));
  const { googleBusinessRegister } = loadConfig(resolve(root, "lib/google-business-profiles.ts"));
  const { locationHasService } = loadConfig(resolve(root, "lib/seo-services.ts"));
  const grouped = new Map();
  for (const record of googleBusinessRegister) {
    if (!grouped.has(record.locationSlug)) grouped.set(record.locationSlug, []);
    grouped.get(record.locationSlug).push(record);
  }
  const inventory = [...grouped.entries()].map(([slug, profiles]) => {
    const location = locations.find(item => item.slug === slug);
    const guidance = localGuidance[slug];
    const recordedAddress = location?.address ?? null;
    const addressHasPremisesNumber = Boolean(recordedAddress && /\d/.test(recordedAddress.streetAddress));
    const active = profiles.some(profile => profile.status === "Active");
    const issues = [];
    if (!location) issues.push("Location is not configured; do not add to sitemap before a genuine page and host are validated.");
    if (!active) issues.push("No Active profile in supplied register; current Google status needs separate verification.");
    if (!recordedAddress) issues.push("No recorded storefront address.");
    else if (!addressHasPremisesNumber) issues.push("Recorded street has no premises number; visitor destination is incomplete.");
    issues.push("Storefront occupancy, opening hours and Google details are not independently verified by this configuration audit.");
    if (!guidance) issues.push("No source-linked local property guidance in the stage-three dataset.");
    if (profiles.length > 1) issues.push("Multiple profiles must remain separate until their premises and roles are verified.");
    return {
      slug, configured: Boolean(location),
      targetUrl: `https://${slug}.gradeaplumbing.store/`,
      suppliedProfiles: profiles.map(({ name, status, mapsUrl }) => ({ name, status, mapsUrl })),
      recordedAddress, addressHasPremisesNumber,
      sourceLinkedLocalGuidance: Boolean(guidance),
      sources: guidance?.sources ?? [],
      serviceIndexingCurrentlyEnabled: location ? locationHasService(location) : false,
      expansionApproved: false,
      priority: !location ? "expansion-review" : active && !locationHasService(location) ? "active-content-and-evidence" : "existing-page-review",
      issues,
    };
  });
  return {
    scope: "Configuration and supplied register audit; not Google indexing or premises verification",
    summary: {
      profileRecords: googleBusinessRegister.length, targets: inventory.length,
      configured: locations.length, expansionTargets: inventory.filter(item => !item.configured).length,
      sourceLinkedLocalGuidance: inventory.filter(item => item.sourceLinkedLocalGuidance).length,
      incompleteRecordedAddresses: inventory.filter(item => item.recordedAddress && !item.addressHasPremisesNumber).length,
      activeServiceNoindexLocations: inventory.filter(item => item.priority === "active-content-and-evidence").length,
    }, inventory,
  };
}

export function unconfiguredHost(host) {
  return loadConfig(resolve(root, "lib/locations.ts")).isUnconfiguredLocationHost(host);
}

export function readSeoConfiguration(relativePath) {
  return loadConfig(resolve(root, relativePath));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = locationReadiness();
  if (process.argv.includes("--live-expansion")) {
    // Read-only probe. A 200 response does not establish a real location page.
    for (const item of report.inventory.filter(item => !item.configured)) {
      try {
        const response = await fetch(item.targetUrl, { signal: AbortSignal.timeout(12000) });
        const html = await response.text();
        const tags = html.match(/<link\b[^>]*>/gi) ?? [];
        const canonicalTag = tags.find(tag => /rel=["']canonical["']/i.test(tag));
        const canonical = canonicalTag?.match(/href=["']([^"']+)/i)?.[1] ?? null;
        item.liveProbe = { status: response.status, finalUrl: response.url, canonical, matchesTarget: canonical === item.targetUrl };
      } catch (error) {
        item.liveProbe = { error: error.message };
      }
    }
  }
  console.log(JSON.stringify(process.argv.includes("--summary") ? report.summary : report, null, 2));
}
