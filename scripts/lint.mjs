import { readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { spawnSync } from "node:child_process";

const roots = ["src", "tests", "scripts"];
const allowed = new Set([".js", ".mjs"]);

function collect(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...collect(full));
    } else if (allowed.has(extname(entry))) {
      files.push(full);
    }
  }
  return files;
}

let status = 0;
for (const root of roots) {
  const files = collect(root);
  for (const file of files) {
    const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
    if (result.status !== 0) {
      status = result.status;
    }
  }
}

if (status !== 0) {
  process.exit(status);
}

console.log("Syntax check passed for JS sources.");
