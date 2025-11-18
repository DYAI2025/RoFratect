import selectors from "./selectors/telegram.json" assert { type: "json" };
import { buildAdapterFromSelectors } from "./selectors-loader.js";

export const TelegramAdapter = buildAdapterFromSelectors(selectors);
