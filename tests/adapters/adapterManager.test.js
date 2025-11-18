import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AdapterManager } from "../../src/adapters/manager.js";
import { WhatsAppAdapter } from "../../src/adapters/whatsapp.js";
import { GenericAdapter } from "../../src/adapters/generic.js";

describe("AdapterManager", () => {
  beforeEach(() => {
    const body = { innerHTML: "" };
    global.window = { document: { body } };
    global.document = window.document;
    global.location = { host: "example.com", href: "https://example.com/", pathname: "/" };
  });

  it("selects the WhatsApp adapter when the host matches", () => {
    global.location = { host: "web.whatsapp.com", href: "https://web.whatsapp.com/", pathname: "/" };
    const adapter = AdapterManager.choose();
    assert.strictEqual(adapter, WhatsAppAdapter);
  });

  it("falls back to the generic adapter for unknown hosts", () => {
    global.location = { host: "unknown.test", href: "https://unknown.test/chat", pathname: "/chat" };
    const adapter = AdapterManager.choose();
    assert.strictEqual(adapter, GenericAdapter);
  });

  it("returns an empty list when scanning fails", () => {
    const faulty = { scanAll: () => { throw new Error("boom"); }, observe: () => {}, match: () => true };
    const result = AdapterManager.scan(faulty);
    assert.deepStrictEqual(result, []);
  });

  it("always returns a cleanup function even if observe fails", () => {
    const faulty = { scanAll: () => [], observe: () => { throw new Error("boom"); }, match: () => true };
    const cleanup = AdapterManager.watch(faulty, () => {});
    assert.strictEqual(typeof cleanup, "function");
    assert.doesNotThrow(() => cleanup());
  });
});
