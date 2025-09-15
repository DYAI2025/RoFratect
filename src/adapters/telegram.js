import { utils } from "./base.js";

export const TelegramAdapter = {
  match: (h) => /web\.telegram\.org$/.test(h),
  scanAll(doc){
    const rows = doc.querySelectorAll('div.message-list-item, .Message');
    const msgs = [];
    rows.forEach(row => {
      const text = row.querySelector('.text-content, .message')?.innerText?.trim() || "";
      if (!text) return;
      const me = row.classList.contains('is-out') || row.classList.contains('own');
      const id = row.getAttribute('data-id') || row.dataset.mid || utils.hash(text);
      msgs.push({ id, speaker: me?"me":"peer", text });
    });
    return msgs;
  },
  observe(doc,onChange){
    const mo = new MutationObserver(utils.debounce(()=>onChange(this.scanAll(doc)),150));
    mo.observe(doc.body,{subtree:true,childList:true,characterData:true});
    return ()=>mo.disconnect();
  },
  threadId(){ return location.search || location.hash || location.pathname; }
};

