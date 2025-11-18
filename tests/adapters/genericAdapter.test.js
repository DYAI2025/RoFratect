import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GenericAdapter } from "../../src/adapters/generic.js";

describe("GenericAdapter", () => {
  it("collects rows of visible text and normalizes whitespace", () => {
    const body = { dataset: {}, parentElement: null };
    const rowA = { tagName: "DIV", dataset: {}, parentElement: body, style: { display: "flex" } };
    const rowB = { tagName: "DIV", dataset: {}, parentElement: body, style: { display: "flex" } };
    const textNodes = [
      { nodeValue: "Peer:", parentElement: rowA },
      { nodeValue: "Hello there", parentElement: rowA },
      { nodeValue: "Me:", parentElement: rowB },
      { nodeValue: "Send the USDT payment", parentElement: rowB }
    ];

    global.NodeFilter = {
      SHOW_TEXT: 4,
      FILTER_ACCEPT: 1,
      FILTER_REJECT: 2
    };

    global.getComputedStyle = el => ({ display: el.style?.display || "block" });

    global.document = {
      body,
      createTreeWalker(_root, _whatToShow, { acceptNode }) {
        let index = 0;
        return {
          nextNode() {
            while (index < textNodes.length) {
              const node = textNodes[index++];
              const res = acceptNode(node);
              if (res === NodeFilter.FILTER_ACCEPT) return node;
            }
            return null;
          }
        };
      }
    };

    const msgs = GenericAdapter.scanAll(document);
    assert.strictEqual(msgs.length, 2);
    assert.ok(msgs[0].text.includes("Peer: Hello there"));
    assert.ok(msgs[1].text.includes("Me: Send the USDT payment"));
  });
});
