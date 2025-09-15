import { GenericAdapter } from "./generic.js";
import { WhatsAppAdapter } from "./whatsapp.js";
import { InstagramAdapter } from "./instagram.js";
import { TelegramAdapter } from "./telegram.js";

/** @type {SiteAdapter[]} */
const ADAPTERS = [WhatsAppAdapter, InstagramAdapter, TelegramAdapter, GenericAdapter];

export const AdapterManager = {
  choose(){
    const h = location.host, u = location.href;
    return ADAPTERS.find(a => safeMatch(a, h, u)) || GenericAdapter;
  },
  scan(adapter){
    try { return adapter.scanAll(document); } catch { return []; }
  },
  watch(adapter, cb){
    try { return adapter.observe(document, cb); } catch { return () => {}; }
  },
  threadId(adapter){
    try { return adapter.threadId?.(document); } catch { return undefined; }
  }
};

function safeMatch(a, h, u){
  try { return a.match(h, u); } catch { return false; }
}

