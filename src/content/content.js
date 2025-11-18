import { loadRegistry } from "../engine/rules.js";
import { ScoringEngine } from "../engine/scorer.js";
import { AdapterManager } from "../adapters/manager.js";
import { paintOverlay, classifyFromThresholds } from "./ui-overlay.js";

let engine, registry, adapter, unsubscribe;
const runScanThrottled = throttle(() => runScan(), 350);

async function init() {
  ({ registry } = await loadRegistry());
  const { markers } = await loadRegistry();
  engine = new ScoringEngine({ registry, markers });

  adapter = AdapterManager.choose();
  runScan();                         // initial
  unsubscribe = AdapterManager.watch(adapter, runScanThrottled); // live updates
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

function throttle(fn, wait = 250){
  let last = 0;
  let timeout;
  let pendingArgs;
  const invoke = () => {
    last = Date.now();
    timeout = undefined;
    fn(...(pendingArgs || []));
    pendingArgs = undefined;
  };
  return (...args) => {
    pendingArgs = args;
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0 || remaining > wait){
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }
      invoke();
    } else if (!timeout) {
      timeout = setTimeout(invoke, remaining);
    }
  };
}

