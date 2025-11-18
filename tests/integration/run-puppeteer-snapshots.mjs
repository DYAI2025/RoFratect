import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const SNAPSHOT_DIR = path.join(ROOT, "tests", "integration", "snapshots");

const SITES = [
  { name: "whatsapp", fixture: "fixtures/whatsapp.html", minMessages: 2, requireSpeakers: ["me", "peer"] },
  { name: "instagram", fixture: "fixtures/instagram.html", minMessages: 2 },
  { name: "telegram", fixture: "fixtures/telegram.html", minMessages: 2, requireSpeakers: ["me", "peer"] }
];

await fs.mkdir(SNAPSHOT_DIR, { recursive: true });

const browser = await puppeteer.launch({ headless: "new" });
try {
  for (const site of SITES) {
    const page = await browser.newPage();
    const fixturePath = path.join(ROOT, "tests", "integration", site.fixture);
    const html = await fs.readFile(fixturePath, "utf-8");
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.addScriptTag({ type: "module", path: path.join(ROOT, "tests", "integration", "helpers", "adapter-harness.js") });
    const msgs = await page.evaluate((siteName) => window.runAdapterTest(siteName), site.name);
    if (msgs.length < site.minMessages) {
      throw new Error(`${site.name}: expected at least ${site.minMessages} messages, got ${msgs.length}`);
    }
    if (site.requireSpeakers) {
      const speakerSet = new Set(msgs.map(m => m.speaker));
      for (const expected of site.requireSpeakers) {
        if (!speakerSet.has(expected)) {
          throw new Error(`${site.name}: missing speaker label ${expected}`);
        }
      }
    }
    await fs.writeFile(path.join(SNAPSHOT_DIR, `${site.name}.json`), JSON.stringify(msgs, null, 2));
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, `${site.name}.png`), fullPage: true });
    await page.close();
  }
  console.log("Integration snapshots refreshed for:", SITES.map(s => s.name).join(", "));
} finally {
  await browser.close();
}
