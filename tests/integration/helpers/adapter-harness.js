import { WhatsAppAdapter } from "../../../src/adapters/whatsapp.js";
import { InstagramAdapter } from "../../../src/adapters/instagram.js";
import { TelegramAdapter } from "../../../src/adapters/telegram.js";

const ADAPTERS = {
  whatsapp: WhatsAppAdapter,
  instagram: InstagramAdapter,
  telegram: TelegramAdapter
};

window.runAdapterTest = function runAdapterTest(site){
  const adapter = ADAPTERS[site];
  if (!adapter) throw new Error(`Unknown adapter: ${site}`);
  return adapter.scanAll(document);
};
