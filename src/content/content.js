import { loadRegistry } from "../engine/rules.js";
import { ScoringEngine } from "../engine/scorer.js";
import { AdapterManager } from "../adapters/manager.js";
import { paintOverlay, classifyFromThresholds } from "./ui-overlay.js";

let engine, registry, adapter, unsubscribe;

async function init() {
  const payload = await loadRegistry();
  registry = payload.registry;
  engine = new ScoringEngine(payload);

  adapter = AdapterManager.choose();
  runScan();                         // initial
  unsubscribe = AdapterManager.watch(adapter, runScan); // live updates
  window.addEventListener("beforeunload", () => unsubscribe && unsubscribe());
}

function runScan() {
  const msgs = AdapterManager.scan(adapter);
  if (!msgs || msgs.length === 0) return;

  const res = engine.score(msgs);
  chrome.storage.local.get(["fp_settings"], ({ fp_settings }) => {
    const s = fp_settings || {};
    const th = s.thresholds || registry.thresholds;
    const level = classifyFromThresholds(res.S, res.killer, th);
    paintOverlay(level, res.S, res.hits);
    const tid = AdapterManager.threadId(adapter) || location.href;
    chrome.storage.local.set({ ["fp_state_"+tid]: { level, score: res.S, hits: res.hits, t: Date.now() } });
  });
}

init();

