import selectors from "./selectors/whatsapp.json" assert { type: "json" };
import { buildAdapterFromSelectors } from "./selectors-loader.js";

export const WhatsAppAdapter = buildAdapterFromSelectors(selectors);
