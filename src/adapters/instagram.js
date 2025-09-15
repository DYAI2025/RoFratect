import { utils } from "./base.js";

export const InstagramAdapter = {
  match: (h,u) => /instagram\.com$/.test(h) && /direct\/t\//.test(u),
  scanAll(doc){
    const rows = doc.querySelectorAll('div[role="listitem"]');
    const msgs = [];
    rows.forEach((row, i) => {
      const text = utils.text(row);
      if (!text) return;
      const me = !!row.querySelector('svg[aria-label="Seen"]') || /\bYou\b$/.test(row.innerText);
      const id = row.id || "ig-"+utils.hash(text+":"+i);
      msgs.push({ id, speaker: me?"me":"peer", text });
    });
    return msgs;
  },
  observe(doc,onChange){
    const mo = new MutationObserver(utils.debounce(()=>onChange(this.scanAll(doc)),150));
    mo.observe(doc.body,{subtree:true,childList:true,characterData:true});
    return ()=>mo.disconnect();
  },
  threadId(){ return new URL(location.href).pathname; }
};

