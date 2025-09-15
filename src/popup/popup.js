const $ = s => document.querySelector(s);

chrome.storage.local.get(["fp_settings"], ({ fp_settings }) => {
  const s = fp_settings || {};
  $("#enabled").checked = s.enabled ?? true;
  $("#warn").value = s.thresholds?.warn ?? 0.55;
  $("#fraud").value = s.thresholds?.fraud_pred ?? 0.68;
  $("#high").value = s.thresholds?.high ?? 0.78;
});

$("#save").addEventListener("click", () => {
  const settings = {
    enabled: $("#enabled").checked,
    thresholds: {
      warn: parseFloat($("#warn").value),
      fraud_pred: parseFloat($("#fraud").value),
      high: parseFloat($("#high").value)
    }
  };
  chrome.storage.local.set({ fp_settings: settings }, () => window.close());
});

