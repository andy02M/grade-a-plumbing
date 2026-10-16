type Entity = { type: string; offset: number; length: number; custom_emoji_id?: string };

// IDs are public Telegram custom-emoji identifiers from the team's selected packs.
export const notificationEmoji: Record<string, string> = {
  "📞": "5893297890117292323",
  "📱": "5895652322469482989",
  "👤": "5902335789798265487",
  "🔔": "4927043115962860393",
  "✅": "4927231742336565822",
  "⚠️": "4927186383186953010",
  "❌": "5893163582194978381",
  "📌": "4929530413128352588",
  "🗑": "4927052874128556810",
  "🚫": "4929731207144407638",
  "💬": "5138673149822370362",
  "💰": "5893473283696759404",
  "⏰": "5902050947567194830",
  "🔎": "5893382531037794941"
};

export function renderCallNotification(source: string, expanded = false) {
  if (!source.includes("GRADE A PLUMBING") || !/CUSTOMER|CALLER/i.test(source)) {
    return { text: source.slice(0, 3900), entities: [] as Entity[], hasMoreEtas: false };
  }
  const output: string[] = [];
  let etaCount = 0;
  let hasMoreEtas = false;
  for (const raw of source.split(/\r?\n/)) {
    let line = raw.trim();
    if (/^[=]{3,}$/.test(line) || /^[🟩🟦🟨🟧🟥🟪⬜]+$/u.test(line) || line === "🚰 GRADE A PLUMBING") continue;
    if (/MAPS & ETA|^📍 ADDRESS CHECK$|^🚗 ETA GUIDE$/.test(line)) continue;
    if (/^✅ Matched:/.test(line)) line = line.replace("✅ Matched:", "📍 Maps verified:");
    if (/^(?:👤|📞) CUSTOMER$/.test(line)) line = "🟦 CUSTOMER DETAILS";
    if (line === "🔧 JOB DETAILS") line = "🟧 JOB DETAILS";
    if (/^✅ (NEW PLUMBING LEAD|GOOGLE MAPS ETA TEST)$/.test(line)) {
      line = line.includes("ETA TEST") ? "🚨 NEW PLUMBING LEAD — TEST 🚨" : "🚨 NEW PLUMBING LEAD 🚨";
    }
    if (/^🟢 Best:/.test(line)) {
      output.push("", "🟩 NEAREST PLUMBER");
      line = line.replace(/^🟢 Best:\s*/, "🚐 ");
      etaCount = 1;
    } else if (etaCount && /^- /.test(line)) {
      for (const entry of line.slice(2).split(" | ")) {
        etaCount++;
        if (etaCount > 4) hasMoreEtas = true;
        if (expanded || etaCount <= 4) output.push(entry);
      }
      continue;
    }
    if (!line && !output.at(-1)) continue;
    output.push(line);
  }
  const text = output.join("\n").trim().slice(0, 3900);
  const entities: Entity[] = [];
  const leadHeading = text.startsWith("🚨 NEW PLUMBING LEAD");
  const quoteOffset = leadHeading ? text.indexOf("\n") + 1 : 0;
  if (text.length > quoteOffset) entities.push({ type: "blockquote", offset: quoteOffset, length: text.length - quoteOffset });
  let offset = 0;
  for (const line of text.split("\n")) {
    if (/^(?:🚨 NEW PLUMBING LEAD|🔔|⚠️ CALLBACK|🚨 MISSED|🟦 CUSTOMER DETAILS|🟧 JOB DETAILS|🟩 NEAREST PLUMBER|📞 CUSTOMER BEING CALLED|👤 CALLING:|🎯 NEXT ACTION|🧩 MISSING DETAILS|Name:|Issue:|🚐 )/.test(line)) {
      entities.push({ type: "bold", offset, length: line.length });
    }
    offset += line.length + 1;
  }
  for (const [emoji, id] of Object.entries(notificationEmoji)) {
    let start = 0;
    while ((start = text.indexOf(emoji, start)) >= 0) {
      entities.push({ type: "custom_emoji", offset: start, length: emoji.length, custom_emoji_id: id });
      start += emoji.length;
    }
  }
  return { text, entities, hasMoreEtas };
}
