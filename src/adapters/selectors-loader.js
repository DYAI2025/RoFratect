import { utils } from "./base.js";

/**
 * Baut zur Laufzeit einen Adapter aus einer JSON-Selektor-Datei.
 * JSON-Felder: host, row, text, mineFlag?, idAttr?, time? (CSS@Attr)
 */
export function buildAdapterFromSelectors(selJson){
  const { host, row, text, mineFlag, idAttr, time } = selJson;
  return {
    match: (h) => new RegExp(host.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"$").test(h),
    scanAll(doc){
      const rows = doc.querySelectorAll(row);
      const msgs = [];
      rows.forEach((r,i)=>{
        const t = text.includes("@") ? utils.pick(r, text) : (r.querySelector(text)?.innerText || "").trim();
        if (!t) return;
        const me = mineFlag ? !!r.querySelector(mineFlag) : false;
        const id = (idAttr ? r.getAttribute(idAttr) : null) || r.id || ("sa-"+utils.hash(t+":"+i));
        let ts;
        if (time) {
          const [q, attr] = time.split("@");
          const v = r.querySelector(q)?.getAttribute(attr||"") || "";
          ts = utils.parseTimeAttr(v);
        }
        msgs.push({ id, ts, speaker: me?"me":"peer", text: t });
      });
      return msgs;
    },
    observe(doc,onChange){
      const mo = new MutationObserver(utils.debounce(()=>onChange(this.scanAll(doc)),150));
      mo.observe(doc.body,{subtree:true,childList:true,characterData:true});
      return ()=>mo.disconnect();
    }
  };
}

