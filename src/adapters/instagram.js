import selectors from "./selectors/instagram.json" assert { type: "json" };
import { buildAdapterFromSelectors } from "./selectors-loader.js";

export const InstagramAdapter = buildAdapterFromSelectors(selectors);
