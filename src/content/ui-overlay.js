const COLORS = {
  none: "transparent",
  warn: "#ffd60a",          // gelb
  fraud: "#ff3b30",         // rot
  high: "#4b0082"           // dunkles lila
};

export function ensureOverlay() {
  let el = document.getElementById("__fp_overlay");
  if (el) return el;
  el = document.createElement("div");
  el.id = "__fp_overlay";
  el.innerHTML = `
    <div class="fp-badge"><span class="fp-level">–</span><span class="fp-score">0.00</span></div>
    <div class="fp-hints"></div>
    <div class="fp-actions">
      <button data-act="stop">Interaktion stoppen</button>
      <button data-act="report">Melden</button>
    </div>`;
  document.documentElement.appendChild(el);
  return el;
}

export function paintOverlay(level, score, hits) {
  const el = ensureOverlay();
  const badge = el.querySelector(".fp-badge");
  const levelEl = el.querySelector(".fp-level");
  const scoreEl = el.querySelector(".fp-score");
  const hints = el.querySelector(".fp-hints");
  el.style.borderColor = COLORS[level];
  badge.style.background = COLORS[level];
  levelEl.textContent = level.toUpperCase();
  scoreEl.textContent = score.toFixed(2);
  hints.textContent = hits.slice(0,5).join(" · ");
}

export function classifyFromThresholds(S, killer, th) {
  if (killer || S >= th.high) return "high";
  if (S >= th.fraud_pred) return "fraud";
  if (S >= th.warn) return "warn";
  return "none";
}

