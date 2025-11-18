import { utils } from "./base.js";

const DEFAULT_HEURISTICS = {
  minRows: 1,
  maxEmptyCycles: 3,
  minSpeakersLabeled: 0,
  speakerSampleSize: 3,
  minAvgChars: 0
};

const THREAD_ID_STRATEGIES = {
  href: () => location.href,
  pathname: () => location.pathname,
  searchOrHash: () => location.search || location.hash || location.pathname
};

function escapeHost(h){
  return h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toRegex(value, { anchorEnd = true } = {}){
  if (!value) return null;
  const source = value.startsWith("^") ? value : escapeHost(value)+(anchorEnd?"$":"");
  return new RegExp(source);
}

function resolveText(row, textSel){
  if (textSel === ":self") return utils.text(row);
  if (!textSel) return "";
  if (textSel.includes("@")) return utils.pick(row, textSel);
  return (row.querySelector(textSel)?.innerText || "").trim();
}

function detectSpeaker(row, mineFlag, speakerCfg){
  if (mineFlag && row.querySelector(mineFlag)) return "me";
  if (!speakerCfg) return "unknown";
  const { flagSelectors, attr, attrMatch = "token", attrSplit, me = [], peer = [] } = speakerCfg;
  if (flagSelectors){
    if (flagSelectors.me && row.querySelector(flagSelectors.me)) return "me";
    if (flagSelectors.peer && row.querySelector(flagSelectors.peer)) return "peer";
  }
  if (attr){
    const raw = attr === "class" ? row.className : (row.getAttribute(attr) || "");
    const splitter = attrSplit || /\s+/;
    const tokens = raw.split(splitter).map(tok => tok.trim()).filter(Boolean);
    const check = (needle, set) => {
      if (!needle) return false;
      return attrMatch === "substring" ? raw.includes(needle) : set.includes(needle);
    };
    if (me.some(token => check(token, tokens))) return "me";
    if (peer.some(token => check(token, tokens))) return "peer";
  }
  return speakerCfg.default || "unknown";
}

function evaluateHeuristics(state, heuristics, rowCount, msgs, hostLabel){
  const ts = Date.now();
  if (rowCount >= heuristics.minRows && msgs.length === 0){
    state.consecutiveEmpty++;
  } else {
    state.consecutiveEmpty = 0;
  }
  if (state.consecutiveEmpty >= heuristics.maxEmptyCycles){
    state.lastFailure = { reason: "rowsWithoutMessages", rowCount, ts };
    console.warn(`[FraudProtect] Selektoren für ${hostLabel} liefern keine Nachrichten mehr.`);
  }

  if (heuristics.minAvgChars > 0 && msgs.length){
    const avg = msgs.reduce((sum,m)=>sum+m.text.length,0) / msgs.length;
    if (avg < heuristics.minAvgChars){
      state.lastWarning = { reason:"shortText", avg, ts };
    }
  }

  if (heuristics.minSpeakersLabeled > 0 && msgs.length >= heuristics.speakerSampleSize){
    const labeled = new Set(msgs.map(m=>m.speaker).filter(s=>s && s !== "unknown"));
    if (labeled.size < heuristics.minSpeakersLabeled){
      state.lastWarning = { reason:"speakerDetection", labeled: labeled.size, ts };
      console.warn(`[FraudProtect] Sprecher-Erkennung für ${hostLabel} wirkt inkonsistent.`);
    }
  }
}

/**
 * Baut zur Laufzeit einen Adapter aus einer JSON-Selektor-Datei.
 * JSON-Felder: host|hosts, row, text, mineFlag?, idAttr?, time? (CSS@Attr)
 */
export function buildAdapterFromSelectors(selJson){
  const { hosts, host, row, text, mineFlag, idAttr, time, urlPattern, heuristics: heuristicsCfg = {}, speaker, threadId: threadIdKey } = selJson;
  const hostRegexes = (hosts && hosts.length ? hosts : host ? [host] : [])
    .map(value => toRegex(value, { anchorEnd: true }))
    .filter(Boolean);
  const urlRegex = urlPattern ? new RegExp(urlPattern) : null;
  const heuristics = { ...DEFAULT_HEURISTICS, ...heuristicsCfg };
  const diagnostics = { consecutiveEmpty: 0, lastFailure: null, lastWarning: null };
  const threadResolver = THREAD_ID_STRATEGIES[threadIdKey || "href"] || THREAD_ID_STRATEGIES.href;
  const hostLabel = host || (hosts ? hosts.join(", ") : "Site");

  return {
    match: (h, u = "") => {
      const hostOk = hostRegexes.length ? hostRegexes.some(rx => rx.test(h)) : true;
      const urlOk = urlRegex ? urlRegex.test(u) : true;
      return hostOk && urlOk;
    },
    scanAll(doc){
      const rows = doc.querySelectorAll(row);
      const msgs = [];
      rows.forEach((r,i)=>{
        const t = resolveText(r, text);
        if (!t) return;
        const speakerValue = detectSpeaker(r, mineFlag, speaker);
        const id = (idAttr ? r.getAttribute(idAttr) : null) || r.id || ("sa-"+utils.hash(t+":"+i));
        let ts;
        if (time) {
          const [q, attr] = time.split("@");
          const v = q ? (q === ":self" ? (attr ? r.getAttribute(attr) : r.textContent) : r.querySelector(q)?.getAttribute(attr||"") || "") : "";
          ts = utils.parseTimeAttr(v);
        }
        msgs.push({ id, ts, speaker: speakerValue, text: t });
      });
      evaluateHeuristics(diagnostics, heuristics, rows.length, msgs, hostLabel);
      return msgs;
    },
    observe(doc,onChange){
      const mo = new MutationObserver(utils.debounce(()=>onChange(this.scanAll(doc)),150));
      mo.observe(doc.body,{subtree:true,childList:true,characterData:true});
      return ()=>mo.disconnect();
    },
    threadId(){
      try {
        return threadResolver();
      } catch {
        return location.href;
      }
    },
    getDiagnostics(){
      return { ...diagnostics };
    }
  };
}

