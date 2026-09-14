import fs from "node:fs";
import path from "node:path";
import { icons } from "@iconify-json/logos";

const repo = path.resolve(new URL("..", import.meta.url).pathname);
const outDir = path.join(repo, "connector icons");
const data = JSON.parse(fs.readFileSync(path.join(outDir, "manifest.json"), "utf8"));
const logoMap = icons.icons;
const normalize = (s) => s.toLowerCase().replace(/&/g, "and").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "");
const aliases = new Map(Object.entries({
  "1inch": "1inch", "aweber": "aweber", "activecampaign": "active-campaign", "agentmail": "agentmail", "ahrefs": "ahrefs", "apify": "apify", "apollo": "apollo", "base": "base", "blockscout": "blockscout", "braze": "braze", "brightdata": "brightdata", "calendarbridge": "calendarbridge", "circleback": "circleback", "clarify": "clarify", "clay": "clay", "coingecko": "coingecko", "cohere": "cohere", "consensus": "consensus", "context7": "context7", "customerio": "customer-io", "dataforseo": "dataforseo", "deel": "deel", "descript": "descript", "dify": "dify", "dropboxapi": "dropbox", "elevenlabsapi": "elevenlabs", "firecrawl": "firecrawl", "fireflies": "fireflies", "flightradar24": "flightradar24", "fullenrich": "fullenrich", "gamma": "gamma", "gocardless": "gocardless", "grok": "grok", "hume": "hume", "jotform": "jotform", "kling": "klingai", "klaviyo": "klaviyo", "launchdarkly": "launchdarkly", "leonardo": "leonardo", "mailerlite": "mailerlite", "mermaidchart": "mermaid", "mondaycom": "monday", "n8napi": "n8n", "navan": "navan", "neon": "neon", "nocodb": "nocodb", "otterai": "otter-ai", "pandadoc": "pandadoc", "plaid": "plaid", "privacycom": "privacycom", "productboard": "productboard", "ramp": "ramp", "readai": "read-ai", "readwise": "readwise", "runway": "runway", "salesloft": "salesloft", "scite": "scite", "signnow": "signnow", "smartsheet": "smartsheet", "sourcegraph": "sourcegraph", "statsig": "statsig", "stytch": "stytch", "tally": "tally", "taskade": "taskade", "tavily": "tavily", "tines": "tines", "tldv": "tldv", "tiktokforbusiness": "tiktok", "tomtommaps": "tomtom", "tripoai": "tripo", "vidiq": "vidiq", "whimsical": "whimsical", "whop": "whop", "workos": "workos", "workable": "workable", "wrike": "wrike", "zendrop": "zendrop", "zernio": "zernio", "zoho": "zoho" }));
const keyByNorm = new Map(Object.keys(logoMap).map((k) => [normalize(k), k]));
let enhanced = 0;
for (const provider of data.providers) {
  if (provider.sourceType !== "fallback-initials") continue;
  const key = aliases.get(normalize(provider.name)) || keyByNorm.get(normalize(provider.name));
  if (!key || !logoMap[key]) continue;
  const entry = logoMap[key];
  const file = path.join(repo, provider.icon);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${entry.width || 24} ${entry.height || 24}"><title>${provider.name}</title>${entry.body}</svg>\n`;
  fs.writeFileSync(file, svg);
  provider.sourceType = "iconify-logos";
  provider.source = "https://github.com/iconify/icon-sets/tree/master/json/logos";
  provider.sourceTitle = key;
  provider.license = "Iconify Logos collection terms; provider trademarks remain theirs";
  delete provider.sourceDomain;
  enhanced++;
}
for (const record of data.records) record.icon = data.providers.find((p) => p.name === record.name)?.icon || record.icon;
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(data, null, 2) + "\n");
console.log(JSON.stringify({ enhanced, remainingFallbacks: data.providers.filter((p) => p.sourceType === "fallback-initials").length }, null, 2));
