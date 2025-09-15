/** @typedef {{id:string, ts?:number, speaker?:"me"|"peer"|"unknown", text:string}} Msg */
/** @typedef {{ match(h:string,u:string):boolean, scanAll(doc:Document):Msg[], observe(doc:Document,onChange:(msgs:Msg[])=>void):()=>void, threadId?(doc:Document):string|undefined }} SiteAdapter */

export const utils = {
  debounce(fn, t=150){ let id; return (...a)=>{ clearTimeout(id); id=setTimeout(()=>fn(...a),t); }; },
  hash(s){
    try {
      const arr = new TextEncoder().encode(s);
      let h=5381; for (let i=0;i<arr.length;i++) h=(h*33)^(arr[i]);
      return (h>>>0).toString(36);
    } catch { return Math.abs(s.split("").reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0,0)).toString(36); }
  },
  text(el){
    if (!el) return "";
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    let t="", n; while (n=walker.nextNode()) t += " " + n.nodeValue;
    return t.replace(/\s+/g," ").trim();
  },
  pick(el, sel){
    if (!sel) return ""; const [q, attr] = sel.split("@");
    const node = el.querySelector(q);
    if (!node) return "";
    if (attr) return node.getAttribute(attr) || "";
    return node.textContent?.trim() || "";
  },
  parseTimeAttr(v){ const n = Date.parse(v||""); return Number.isFinite(n)?n:undefined; }
};

