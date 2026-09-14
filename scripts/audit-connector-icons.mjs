import fs from "node:fs";
import path from "node:path";
import * as simpleIcons from "simple-icons";

const repo = path.resolve(new URL("..", import.meta.url).pathname);
const inventoryPath = path.join(repo, "manus_connector_inventory.txt");
const rows = fs.readFileSync(inventoryPath, "utf8").split(/\r?\n/).slice(1).filter((line) => /^\S+\s{2}/.test(line));
const names = rows.map((line) => line.replace(/^\S+\s{2}/, "").replace(/\s{2}\[.*$/, "").trim());
const iconNames = Object.keys(simpleIcons).filter((key) => key.startsWith("si"));
const slugMap = new Map(iconNames.map((key) => [key.slice(2).toLowerCase(), key]));
const normalize = (name) => name.toLowerCase().replace(/&/g, "and").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "");
const aliases = new Map([
  ["1inch", "oneinch"], ["aws knowledge", "amazonwebservices"], ["aws marketplace", "amazonwebservices"], ["ahrefs api", "ahrefs"], ["apify", "apify"], ["apollo api", "apollo"], ["base", "base"], ["bigdata.com", "bigdata"], ["cal.com", "caldotcom"], ["cloudflare api", "cloudflare"], ["clover api", "clover"], ["coinmarketcap", "coinmarketcap"], ["customer.io", "customerio"], ["dataforseo", "dataforseo"], ["day ai", "dayone"], ["dropbox api", "dropbox"], ["elevenlabs api", "elevenlabs"], ["flux api", "blackforestlabs"], ["google ads", "googleads"], ["google calendar", "googlecalendar"], ["google gemini", "googlegemini"], ["google maps", "googlemaps"], ["google workspace", "googleworkspace"], ["heygen api", "heygen"], ["highlevel leadconnector", "highlevel"], ["instagram creator marketplace", "instagram"], ["mailchimp marketing", "mailchimp"], ["meta ads manager", "meta"], ["microsoft clarity", "microsoft"], ["openrouter api", "openrouter"], ["paypal for business", "paypal"], ["publer api", "publer"], ["similarweb api", "similarweb"], ["stripe api", "stripe"], ["supabase api", "supabase"], ["toast api", "toast"], ["twilio documentation", "twilio"], ["veed fabric", "veed"], ["wave api", "wave"], ["yelp api", "yelp"], ["zendesk api", "zendesk"],
]);
const matches = names.map((name) => {
  const preferred = aliases.get(name.toLowerCase()) ?? normalize(name);
  const key = slugMap.get(preferred) ?? slugMap.get(normalize(name));
  return { name, key: key ?? null, slug: key ? key.slice(2) : null };
});
const report = { recordCount: rows.length, uniqueNameCount: new Set(names).size, matchedCount: matches.filter((m) => m.key).length, unmatched: matches.filter((m) => !m.key).map((m) => m.name), matches };
fs.writeFileSync(path.join(repo, "connector-icon-audit.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ recordCount: report.recordCount, uniqueNameCount: report.uniqueNameCount, matchedCount: report.matchedCount, unmatchedCount: report.unmatched.length, unmatched: report.unmatched }, null, 2));
