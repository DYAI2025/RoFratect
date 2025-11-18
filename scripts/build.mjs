import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const outDir = join(projectRoot, "dist");

if (existsSync(outDir)) {
  rmSync(outDir, { recursive: true, force: true });
}

const assets = [
  ["manifest.json", "manifest.json"],
  ["markers", "markers"],
  ["src", "src"],
  ["README.md", "README.md"],
  ["DOCUMENTATION.md", "DOCUMENTATION.md"]
];

for (const [srcRel, destRel] of assets) {
  const src = join(projectRoot, srcRel);
  const dest = join(outDir, destRel);
  const destDir = dirname(dest);
  mkdirSync(destDir, { recursive: true });
  cpSync(src, dest, { recursive: true });
}

const zipName = "rofratect.zip";
const zipPath = join(outDir, zipName);
if (existsSync(zipPath)) {
  rmSync(zipPath);
}
execSync(`cd ${outDir} && zip -r ${zipName} .`, { stdio: "inherit" });

console.log(`\nCreated ${zipPath}`);
