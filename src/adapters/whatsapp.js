import { utils } from "./base.js";

export const WhatsAppAdapter = {
  match: (h,u) => /web\.whatsapp\.com$/.test(h),
  scanAll(doc){
    const panel = doc.querySelector('[data-testid="conversation-panel"]');
    if (!panel) return [];
    const rows = panel.querySelectorAll('[role="row"]');
    const outSel = '[data-testid="msg-out"]';
    const txtSel = '[data-testid="msg-container"]';
    const timeSel = 'time';
    const msgs = [];

    rows.forEach((row, i) => {
      const text = (row.querySelector(txtSel)?.innerText || "").trim();
      if (!text) return;
      const me = !!row.querySelector(outSel);
      const id = row.getAttribute("data-id") || utils.hash(text + ":" + i);
      const timeEl = row.querySelector(timeSel);
      const ts = timeEl?.getAttribute("datetime") ? Date.parse(timeEl.getAttribute("datetime")) : undefined;
      msgs.push({ id, ts, speaker: me ? "me" : "peer", text });
    });
    return msgs;
  },
  observe(doc, onChange){
    const mo = new MutationObserver(utils.debounce(()=>onChange(this.scanAll(doc)), 120));
    mo.observe(doc.body, { subtree:true, childList:true, characterData:true });
    return () => mo.disconnect();
  },
  threadId(){ return location.pathname; }
};

