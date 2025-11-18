let loadPromise;

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
}

function manifestEntries(registry) {
  const manifest =
    registry.marker_sources ||
    registry.markerSources ||
    registry.markerManifest ||
    registry.markers;

  if (!manifest || typeof manifest !== "object") return [];
  return Object.entries(manifest);
}

export function loadRegistry() {
  if (!loadPromise) {
    loadPromise = (async () => {
      const registryUrl = chrome.runtime.getURL("markers/registry.json");
      const registry = await fetchJson(registryUrl);
      const entries = manifestEntries(registry);

      if (entries.length === 0) {
        console.warn(
          "[RoFratect] No marker manifest declared in markers/registry.json; no marker rules will be loaded."
        );
      }

      const failures = [];
      const markerPromises = entries.flatMap(([tier, files = []]) =>
        (files || []).map(async file => {
          const path = `markers/${tier}/${file}`;
          const url = chrome.runtime.getURL(path);
          try {
            return await fetchJson(url);
          } catch (error) {
            failures.push({ path, error });
            return null;
          }
        })
      );

      const markers = (await Promise.all(markerPromises)).filter(Boolean);

      if (failures.length > 0) {
        console.warn(
          `[RoFratect] Failed to load ${failures.length} marker(s): ${failures
            .map(({ path }) => path)
            .join(", ")}`,
          failures
        );
      }

      return { registry, markers };
    })();
  }

  return loadPromise;
}
