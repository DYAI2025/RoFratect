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
        let obj;
        try {
          obj = JSON.parse(readFileSync(full, "utf8"));
        } catch (err) {
          throw new Error(`Failed to parse JSON in marker file: ${full}\n${err.message}`);
        }
        if (want.has(obj.id)) found.push(obj);
      }
    }
  };

  scan(root);
  const foundIds = new Set(found.map(obj => obj.id));
  const missing = [...want].filter(id => !foundIds.has(id));
  if (missing.length > 0) {
    throw new Error(
      `loadMarkersById: The following marker IDs were requested but not found: ${missing.join(", ")}`
    );
  }
  return found;
}
