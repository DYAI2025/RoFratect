import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export function loadMarkersById(ids) {
  const root = join(process.cwd(), "markers");
  const found = [];
  const want = new Set(ids);

  const scan = dir => {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        scan(full);
      } else if (entry.endsWith(".json") && entry !== "registry.json") {
        const obj = JSON.parse(readFileSync(full, "utf8"));
        if (want.has(obj.id)) found.push(obj);
      }
    }
  };

  scan(root);
  return found;
}
