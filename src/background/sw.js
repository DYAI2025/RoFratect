chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    fp_settings: {
      thresholds: { warn: 0.55, fraud_pred: 0.68, high: 0.78 },
      enabled: true
    }
  });
});

