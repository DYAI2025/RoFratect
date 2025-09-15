export async function loadRegistry() {
  const reg = await fetch(chrome.runtime.getURL("markers/registry.json")).then(r => r.json());
  const glob = [];
  for (const tier of ["high","medium","soft"]) {
    const dir = `markers/${tier}/`;
    const files = [
      // statisch gelistete Files, ergänze alle die du nutzt
      "SEM_PAYMENT_METHOD_REQUEST.json",
      "SEM_INVESTMENT_PIVOT.json",
      "SEM_CUSTOMS_PACKAGE_FEE.json",
      "SEM_TRAVEL_VISA_EMERGENCY.json",
      "SEM_PLATFORM_SWITCH_WHATSAPP.json",
      "SEM_MT4_MT5_EXCHANGE.json",
      "SEM_SIGNAL_GROUP_INVITE.json",
      "SEM_USDT_WALLET_REQUEST.json",
      "ATO_WEBCAM_PHRASE.json",
      "SEM_MILITARY_OFFSHORE_COVER.json",
      "SEM_DISAPPEARING_MSG_WHATSAPP.json",
      "CLU_ALIAS_NAME_CHANGE.json",
      "CLU_NAME_VARIATION.json",
      "CLU_AGE_INCONSISTENCY.json",
      "SEM_STATUS_GRANDIOSE.json",
      "SEM_QUESTION_DEFLECTION.json",
      "SEM_PASSIVE_INCOME_FRAME.json",
      "SEM_ID_VERIFICATION_AVOIDANCE.json",
      "ATO_LOVE_BOMBING.json",
      "ATO_GUILT_TRIP.json",
      "ATO_FUTURE_FAKING.json"
    ];
    for (const f of files) {
      try { glob.push(await fetch(chrome.runtime.getURL(dir + f)).then(r => r.json())); } catch {}
    }
  }
  return { registry: reg, markers: glob };
}

