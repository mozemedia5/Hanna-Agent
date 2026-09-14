import fs from "node:fs";
import path from "node:path";
const repo = path.resolve(new URL("..", import.meta.url).pathname);
const outDir = path.join(repo, "connector icons");
const data = JSON.parse(fs.readFileSync(path.join(outDir, "manifest.json"), "utf8"));
const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "").replace(/api$/, "").replace(/documentation$/, "").replace(/marketing$/, "").replace(/manager$/, "").replace(/forbusiness$/, "").replace(/asset$/, "").replace(/bindings$/, "").replace(/leadconnector$/, "").replace(/maps$/, "").replace(/mail$/, "").replace(/calendar$/, "");
const good = data.providers.filter((p) => p.sourceType !== "fallback-initials");
let reconciled = 0;
for (const target of data.providers.filter((p) => p.sourceType === "fallback-initials")) {
  const key = clean(target.name);
  const parent = good.find((p) => clean(p.name) === key || clean(p.name).startsWith(key) || key.startsWith(clean(p.name)));
  if (!parent) continue;
  const sourceFile = path.join(repo, parent.icon);
  const ext = path.extname(sourceFile);
  const filename = target.icon.replace(/\.[^.]+$/, ext.split(".").pop());
  fs.copyFileSync(sourceFile, path.join(repo, filename));
  target.icon = filename;
  target.sourceType = "shared-provider-icon";
  target.source = parent.source;
  target.sourceTitle = parent.sourceTitle || parent.name;
  target.license = parent.license;
  delete target.sourceDomain;
  reconciled++;
}
for (const record of data.records) record.icon = data.providers.find((p) => p.name === record.name)?.icon || record.icon;
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(data, null, 2) + "\n");
console.log(JSON.stringify({ reconciled, remainingFallbacks: data.providers.filter((p) => p.sourceType === "fallback-initials").length }, null, 2));
