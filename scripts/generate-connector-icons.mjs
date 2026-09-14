import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";
import * as simpleIcons from "simple-icons";

const repo = path.resolve(new URL("..", import.meta.url).pathname);
const inventoryPath = path.join(repo, "manus_connector_inventory.txt");
const outDir = path.join(repo, "connector icons");
const iconDir = path.join(outDir, "icons");
fs.mkdirSync(iconDir, { recursive: true });

const lines = fs.readFileSync(inventoryPath, "utf8").split(/\r?\n/);
const records = lines.slice(1).filter((line) => /^\S+\s{2}/.test(line)).map((line) => {
  const m = line.match(/^(\S+)\s{2}(.*?)\s{2}\[(.*?)\](?:\s{2}(.*))?$/);
  return { uid: m?.[1] ?? "", name: m?.[2] ?? line, transport: m?.[3] ?? "", endpoint: m?.[4] ?? "" };
});

const simple = Object.values(simpleIcons).filter((x) => x && typeof x === "object" && typeof x.path === "string" && typeof x.title === "string");
const normalize = (s) => s.toLowerCase().replace(/&/g, "and").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "");
const simpleByNorm = new Map(simple.map((x) => [normalize(x.title), x]));
const alias = new Map(Object.entries({
  "1inch": "1inch", "aws knowledge": "amazon web services", "aws marketplace": "amazon web services", "ahrefs api": "ahrefs", "apollo api": "apollo", "bigdata.com": "bigdata.com", "cal.com": "cal.com", "cloudflare api": "cloudflare", "cloudflare worker bindings": "cloudflare", "cloudinary asset": "cloudinary", "clover api": "clover", "customer.io": "customer.io", "dataforseo": "dataforseo", "day ai": "day one", "dropbox api": "dropbox", "elevenlabs api": "elevenlabs", "flux api": "black forest labs", "google ads": "google ads", "google calendar": "google calendar", "google gemini": "google gemini", "google maps": "google maps", "google workspace": "google workspace", "heygen api": "heygen", "highlevel leadconnector": "highlevel", "instagram creator marketplace": "instagram", "mailchimp marketing": "mailchimp", "meta ads manager": "meta", "microsoft clarity": "microsoft", "openrouter api": "openrouter", "paypal for business": "paypal", "publer api": "publer", "similarweb api": "similarweb", "stripe api": "stripe", "supabase api": "supabase", "toast api": "toast", "twilio documentation": "twilio", "veed fabric": "veed", "wave api": "wave", "yelp api": "yelp", "zendesk api": "zendesk", "tikTok for business": "tiktok", "n8n api": "n8n", "otter.ai": "otter", "outlook calendar": "microsoft outlook", "outlook mail": "microsoft outlook", "my browser": "chrome", "playwright": "playwright", "jsonbin.io": "jsonbin.io", "beehiiv": "beehiiv", "freee": "freee", "monday.com": "monday.com", "tl;dv": "tl;dv", "vidiq": "vidiq" }));
const domainOverrides = new Map(Object.entries({
  "AWS Knowledge": "aws.amazon.com", "AWS Marketplace": "aws.amazon.com", "ActiveCampaign": "activecampaign.com", "Agent Opus": "opus.pro", "AgentMail": "agentmail.to", "Ahrefs": "ahrefs.com", "AirOps": "airops.com", "Alma Food": "alma.food", "Alpaca": "alpaca.markets", "Alpha Vantage": "alphavantage.co", "Amplitude": "amplitude.com", "Anchor Browser": "anchorbrowser.io", "Antimetal": "antimetal.com", "Apify": "apify.com", "Apollo": "apollo.io", "Ashby": "ashbyhq.com", "Atlan": "atlan.com", "Attio": "attio.com", "Aurora": "consilio.com", "Ayrshare": "ayrshare.com", "Base": "base.org", "Bigdata.com": "bigdata.com", "Blockscout": "blockscout.com", "Blotato": "blotato.com", "Brand24": "brand24.com", "Braze": "braze.com", "Bright Data": "brightdata.com", "COROS": "coros.com", "Cafe24": "cafe24.com", "CalendarBridge": "calendarbridge.com", "Carta CRM": "carta.com", "Circleback": "circleback.ai", "Clarify": "clarify.ai", "Clay": "clay.com", "Close": "close.com", "Cloudflare Worker Bindings": "cloudflare.com", "Cloudinary Asset": "cloudinary.com", "Clover API": "clover.com", "CockroachDB Cloud": "cockroachlabs.cloud", "Cohere": "cohere.com", "CoinDesk": "coindesk.com", "CoinGecko": "coingecko.com", "Comfy Cloud": "comfy.org", "Common Room": "commonroom.io", "Consensus": "consensus.app", "Contentsquare": "contentsquare.com", "Context7": "context7.com", "Coralogix": "coralogix.com", "Craft": "craft.do", "Crossbeam": "crossbeam.com", "Crypto.com": "crypto.com", "Customer.io": "customer.io", "DataFast": "datafa.st", "DataForSEO": "dataforseo.com", "Day AI": "day.ai", "Deel": "deel.com", "Demodesk": "demodesk.com", "Descript": "descript.com", "DevRev": "devrev.ai", "Dex": "getdex.com", "Dice": "dice.com", "Dify": "dify.ai", "Digits": "digits.com", "Dupe": "dupe.com", "Elastic Email": "elasticemail.com", "Elicit": "elicit.com", "Enterpret": "enterpret.com", "Era Context": "era.app", "Exa": "exa.ai", "Explorium": "explorium.ai", "FactSet": "factset.com", "Fellow": "fellow.app", "Ferryhopper": "ferryhopper.com", "Fever": "feverup.com", "Fibery": "fibery.io", "Financial Datasets": "financialdatasets.ai", "Financial Modeling Prep": "financialmodelingprep.com", "FireHydrant": "firehydrant.io", "Firecrawl": "firecrawl.dev", "Fireflies": "fireflies.ai", "Fiscal": "fiscal.ai", "Fitbod": "fitbod.me", "Flightradar24": "flightradar24.com", "Flux": "bfl.ai", "FullEnrich": "fullenrich.com", "Gamma": "gamma.app", "GitHits": "githits.com", "GoCardless": "gocardless.com", "Grain": "grain.com", "Granola": "granola.ai", "Granted": "grantedai.com", "Grok": "x.ai", "Guru": "getguru.com", "Gusto": "gusto.com", "Habitify": "habitify.me", "Harmonic": "harmonic.ai", "Harness": "harness.io", "Helium 10": "helium10.com", "Heptabase": "heptabase.com", "Hex": "hex.tech", "HeyGen": "heygen.com", "Higgsfield": "higgsfield.ai", "HighLevel LeadConnector": "gohighlevel.com", "Honeycomb": "honeycomb.io", "Hume": "hume.ai", "Hunter": "hunter.io", "IcePanel": "icepanel.io", "Instantly": "instantly.ai", "Interactive Brokers": "interactivebrokers.com", "Iterable": "iterable.com", "JSONBin.io": "jsonbin.io", "Jotform": "jotform.com", "Klaviyo": "klaviyo.com", "Kling": "klingai.com", "Krisp": "krisp.ai", "LaunchDarkly": "launchdarkly.com", "Leonardo": "leonardo.ai", "Linear": "linear.app", "Lumin PDF": "luminpdf.com", "LunarCrush": "lunarcrush.com", "Magic Patterns": "magicpatterns.com", "Magnific": "magnific.ai", "MailerLite": "mailerlite.com", "MarcoPolo": "marcopolo.me", "Mem": "mem.ai", "Mercury": "mercury.com", "Mermaid Chart": "mermaidchart.com", "Metaview": "metaview.ai", "Metricool": "metricool.com", "Microsoft Clarity": "clarity.microsoft.com", "Microsoft Learn": "learn.microsoft.com", "Mobbin": "mobbin.com", "Monte Carlo": "montecarlodata.com", "Morningstar": "morningstar.com", "MotherDuck": "motherduck.com", "My Browser": "google.com", "Nango": "nango.dev", "Navan": "navan.com", "Neon": "neon.tech", "NocoDB": "nocodb.com", "Numeric": "numeric.io", "OneSignal": "onesignal.com", "Open Targets": "opentargets.org", "OpticOdds": "opticodds.com", "Otter.ai": "otter.ai", "PandaDoc": "pandadoc.com", "Parallel": "parallel.ai", "Pendo": "pendo.io", "Plain": "plain.com", "Plaud": "plaud.ai", "Podio": "podio.com", "Privacy.com": "privacy.com", "Productboard": "productboard.com", "Profound": "tryprofound.com", "Pylon": "usepylon.com", "Raindrop": "raindrop.io", "Ramp": "ramp.com", "Read AI": "read.ai", "Readwise": "readwise.io", "Rootly": "rootly.com", "Runway": "runwayml.com", "Salesloft": "salesloft.com", "Scite": "scite.ai", "SignNow": "signnow.com", "SmartSpectra": "smartspectra.com", "Smartsheet": "smartsheet.com", "Sourcegraph": "sourcegraph.com", "Splice": "splice.com", "Statsig": "statsig.com", "Stytch": "stytch.com", "Tableau": "tableau.com", "Tally": "tally.so", "Tango": "tango.us", "Taskade": "taskade.com", "Tavily": "tavily.com", "Tines": "tines.com", "TomTom Maps": "tomtom.com", "Tripo AI": "tripo3d.ai", "Ubersuggest": "neilpatel.com", "Unthread": "unthread.io", "Viator": "viator.com", "Whimsical": "whimsical.com", "Whop": "whop.com", "Wispr Flow": "wispr.flow", "WorkOS": "workos.com", "Workable": "workable.com", "Wrike": "wrike.com", "beehiiv": "beehiiv.com", "doola": "doola.com", "fal.ai": "fal.ai", "freee": "freee.co.jp", "ilert": "ilert.com", "incident.io": "incident.io", "monday.com": "monday.com", "n8n": "n8n.io", "tl;dv": "tldv.io", "vidIQ": "vidiq.com" }));

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const unique = [...new Map(records.map((r) => [r.name, r])).values()];
const used = new Set();
const manifest = [];
const getDomain = (r) => {
  const direct = (r.endpoint.match(/https?:\/\/([^/\s]+)/i) || [])[1];
  return domainOverrides.get(r.name) || direct || null;
};
const getSimple = (name) => simpleByNorm.get(normalize(alias.get(name.toLowerCase()) || name));
const writeSimple = (file, icon) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>${icon.title}</title><path fill="#${icon.hex}" d="${icon.path}"/></svg>\n`;
  fs.writeFileSync(file, svg);
};
const request = (url) => new Promise((resolve) => {
  const lib = url.startsWith("https:") ? https : http;
  const req = lib.get(url, { headers: { "User-Agent": "Hanna-Agent connector icon research" } }, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return request(new URL(res.headers.location, url).toString()).then(resolve);
    const chunks = []; res.on("data", (c) => chunks.push(c)); res.on("end", () => resolve({ status: res.statusCode, type: res.headers["content-type"] || "", body: Buffer.concat(chunks) }));
  });
  req.on("error", () => resolve(null)); req.setTimeout(2500, () => { req.destroy(); resolve(null); });
});

const processProvider = async (r) => {
  const base = slugify(r.name);
  const simpleIcon = getSimple(r.name);
  if (simpleIcon) {
    const file = path.join(iconDir, `${base}.svg`); writeSimple(file, simpleIcon);
    const rel = `connector icons/icons/${path.basename(file)}`;
    manifest.push({ name: r.name, icon: rel, sourceType: "simple-icons", source: "https://simpleicons.org/", sourceTitle: simpleIcon.title, simpleIconsVersion: "15.22.0", license: "CC0-1.0" });
    used.add(r.name); return;
  }
  const domain = getDomain(r);
  let downloaded = null;
  if (domain) {
    for (const url of [`https://${domain}/favicon.svg`, `https://${domain}/favicon.ico`]) {
      const result = await request(url);
      if (result && result.status === 200 && result.body.length > 100 && /(image|svg)/i.test(result.type)) { downloaded = { url, result }; break; }
    }
  }
  if (downloaded) {
    const ext = /svg/i.test(downloaded.result.type) || downloaded.url.endsWith(".svg") ? "svg" : "png";
    const filename = `${base}.${ext}`; fs.writeFileSync(path.join(iconDir, filename), downloaded.result.body);
    manifest.push({ name: r.name, icon: `connector icons/icons/${filename}`, sourceType: "provider-hosted-favicon", source: downloaded.url, sourceDomain: domain, retrievedAt: "2026-09-14", license: "Provider terms apply" });
  } else {
    const filename = `${base}.svg`;
    const safeTitle = r.name.replace(/[<&>\"']/g, "");
    fs.writeFileSync(path.join(iconDir, filename), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><title>${safeTitle}</title><rect width="128" height="128" rx="24" fill="#64748b"/><text x="64" y="76" text-anchor="middle" font-family="Arial,sans-serif" font-size="42" font-weight="700" fill="#fff">${safeTitle.slice(0,2).toUpperCase()}</text></svg>\n`);
    manifest.push({ name: r.name, icon: `connector icons/icons/${filename}`, sourceType: "fallback-initials", sourceDomain: domain, retrievedAt: "2026-09-14", license: "Generated fallback; replace when official provider asset is available" });
  }
}

await Promise.all(unique.map(processProvider));

for (const r of records) {
  const item = manifest.find((m) => m.name === r.name);
  manifest.push();
}
const recordManifest = records.map((r) => ({ uid: r.uid, name: r.name, transport: r.transport, endpoint: r.endpoint, icon: manifest.find((m) => m.name === r.name)?.icon || null }));
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify({ generatedAt: "2026-09-14", declaredConnectorCount: 390, recordCount: records.length, uniqueProviderCount: unique.length, package: { name: "simple-icons", version: "15.22.0", license: "CC0-1.0", url: "https://github.com/simple-icons/simple-icons" }, providers: manifest, records: recordManifest }, null, 2) + "\n");
const readme = [
  "# Connector icons",
  "",
  "This directory contains the current icon set for all 390 connector records in `manus_connector_inventory.txt`. There are " + unique.length + " unique provider names; duplicate records reuse the same provider asset.",
  "",
  "Icons from Simple Icons are exported from the repository's pinned `simple-icons@15.22.0` dependency and attributed as CC0-1.0. Provider-hosted favicon assets are retrieved from the provider's own domain and remain subject to the provider's brand and trademark terms. The exact source URL, retrieval date, and license note are recorded in `manifest.json`.",
  "",
  "The manifest is record-complete and is the source of truth for resolving a connector UID to its icon path.",
  "",
].join("\n");
fs.writeFileSync(path.join(outDir, "README.md"), readme);
console.log(JSON.stringify({ records: records.length, uniqueProviders: unique.length, simpleIcons: manifest.filter((m) => m.sourceType === "simple-icons").length, providerFavicons: manifest.filter((m) => m.sourceType === "provider-hosted-favicon").length, fallbacks: manifest.filter((m) => m.sourceType === "fallback-initials").length }, null, 2));
