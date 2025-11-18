import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ScoringEngine } from "../../src/engine/scorer.js";
import { loadMarkersById } from "../helpers/loadMarkers.js";
import { transcripts } from "../fixtures/transcripts.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const registry = JSON.parse(readFileSync(join(__dirname, "../../markers/registry.json"), "utf8"));

let engine;

before(() => {
  const markers = loadMarkersById([
    "SEM_INVESTMENT_PIVOT",
    "SEM_PAYMENT_METHOD_REQUEST",
    "SEM_PLATFORM_SWITCH_WHATSAPP",
    "ATO_WEBCAM_PHRASE"
  ]);
  engine = new ScoringEngine({ registry, markers });
});

describe("ScoringEngine", () => {
  it("activates the investment pivot marker when transcript mentions mentoring trades", () => {
    const res = engine.score(transcripts.investmentPitch());
    assert.ok(res.hits.includes("SEM_INVESTMENT_PIVOT"));
    assert.ok(res.raw > 0);
  });

  it("applies category weights when multiple classes fire", () => {
    const res = engine.score(transcripts.paymentMethodAndWebcam());
    assert.ok(res.hits.includes("SEM_PAYMENT_METHOD_REQUEST"));
    assert.ok(res.hits.includes("ATO_WEBCAM_PHRASE"));
    assert.ok(Math.abs(res.raw - 3.39) < 0.01);
  });

  it("flags killer combos when WhatsApp switch and webcam avoidance co-occur", () => {
    const res = engine.score(transcripts.whatsappSwitchWithWebcam());
    assert.ok(res.hits.includes("SEM_PLATFORM_SWITCH_WHATSAPP"));
    assert.ok(res.hits.includes("ATO_WEBCAM_PHRASE"));
    assert.strictEqual(res.killer, true);
  });
});
