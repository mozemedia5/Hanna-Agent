import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const repo = path.resolve(new URL("..", import.meta.url).pathname);
const outDir = path.join(repo, "connector icons");
const data = JSON.parse(fs.readFileSync(path.join(outDir, "manifest.json"), "utf8"));
const get = (url) => new Promise((resolve) => {
  const req = https.get(url, { headers: { "User-Agent": "Hanna-Agent connector icon research" } }, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return get(new URL(res.headers.location, url).toString()).then(resolve);
    const chunks = []; res.on("data", (c) => chunks.push(c)); res.on("end", () => resolve({ status: res.statusCode, type: res.headers["content-type"] || "", body: Buffer.concat(chunks) }));
  });
  req.on("error", () => resolve(null)); req.setTimeout(8000, () => { req.destroy(); resolve(null); });
});
let downloaded = 0;
await Promise.all(data.providers.filter((p) => p.sourceType === "fallback-initials" && p.sourceDomain).map(async (p) => {
  const result = await get(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(p.sourceDomain)}&sz=128`);
  if (!result || result.status !== 200 || !result.body.length || !/image\/png/i.test(result.type)) return;
  const filename = path.basename(p.icon).replace(/\.svg$/, ".png");
  fs.writeFileSync(path.join(repo, "connector icons", "icons", filename), result.body);
  p.icon = `connector icons/icons/${filename}`;
  p.sourceType = "domain-favicon-service";
  p.source = `https://www.google.com/s2/favicons?domain=${p.sourceDomain}&sz=128`;
  p.license = "Favicon aggregation service; provider trademarks remain theirs";
  downloaded++;
}));
for (const record of data.records) record.icon = data.providers.find((p) => p.name === record.name)?.icon || record.icon;
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(data, null, 2) + "\n");
console.log(JSON.stringify({ downloaded, remainingFallbacks: data.providers.filter((p) => p.sourceType === "fallback-initials").length }, null, 2));
