import { utils } from "./base.js";

export const GenericAdapter = {
  match: () => true,
  scanAll(doc){
    const texts = [];
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.nodeValue && n.nodeValue.trim().length > 2 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    let node; while (node = walker.nextNode()) texts.push(node);

    const rows = new Map();
    for (const n of texts) {
      let el = n.parentElement;
      while (el && el !== doc.body) {
        const cs = getComputedStyle(el);
        if (cs.display.includes("flex") || cs.display.includes("grid") || el.getAttribute("role")==="listitem" || /^P|DIV$/i.test(el.tagName)) break;
        el = el.parentElement;
      }
      const key = el ? (el.dataset.__fp_row ||= "r"+Math.random().toString(36).slice(2)) : "body";
      rows.set(key, (rows.get(key)||"") + " " + n.nodeValue);
    }

    let i=0;
    return [...rows.values()]
      .map(t => t.replace(/\s+/g," ").trim())
      .filter(t => t.length > 2)
      .map(t => ({ id:"g-"+(i++), speaker:"unknown", text:t }));
  },
  observe(doc, onChange){
    const mo = new MutationObserver(utils.debounce(()=>onChange(this.scanAll(doc)), 200));
    mo.observe(doc.body, { subtree:true, childList:true, characterData:true });
    return () => mo.disconnect();
  }
};

