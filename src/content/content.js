import { loadRegistry } from "../engine/rules.js";
import { ScoringEngine } from "../engine/scorer.js";
import { AdapterManager } from "../adapters/manager.js";
import { paintOverlay, classifyFromThresholds } from "./ui-overlay.js";

let engine, registry, adapter, unsubscribe;
let settings = { enabled: true };

async function init() {
  const { registry: loadedRegistry, markers } = await loadRegistry();
  registry = loadedRegistry;
  engine = new ScoringEngine({ registry, markers });
  adapter = AdapterManager.choose();

  chrome.storage.local.get(["fp_settings"], ({ fp_settings }) => {
    applySettings(fp_settings);
  });

  chrome.storage.onChanged.addListener(handleSettingsChange);
  window.addEventListener("beforeunload", cleanup);
}

function handleSettingsChange(changes, area) {
  if (area !== "local" || !changes.fp_settings) return;
  applySettings(changes.fp_settings.newValue);
}

function applySettings(fpSettings = {}) {
  settings = {
    enabled: fpSettings.enabled ?? true,
    thresholds: fpSettings.thresholds || registry.thresholds
  };

  if (!settings.enabled) {
    stopWatching();
    teardownOverlay();
    return;
  }

  startWatching();
}

function startWatching() {
  if (unsubscribe || !adapter) return;
  runScan();
  unsubscribe = AdapterManager.watch(adapter, runScan);
}

function stopWatching() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = undefined;
  }
}

function cleanup() {
  stopWatching();
  chrome.storage.onChanged.removeListener(handleSettingsChange);
}

function runScan() {
  if (!settings?.enabled) return;

  const msgs = AdapterManager.scan(adapter);
  if (!msgs || msgs.length === 0) return;

  const res = engine.score(msgs);
  const th = settings.thresholds || registry.thresholds;
  const level = classifyFromThresholds(res.S, res.killer, th);
  paintOverlay(level, res.S, res.hits);
  const tid = AdapterManager.threadId(adapter) || location.href;
  chrome.storage.local.set({ ["fp_state_"+tid]: { level, score: res.S, hits: res.hits, t: Date.now() } });
}

function teardownOverlay() {
  const el = document.getElementById("__fp_overlay");
  if (el) el.remove();
}

init();

