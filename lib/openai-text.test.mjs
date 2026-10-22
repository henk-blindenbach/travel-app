import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRequire } from "node:module";

// Compile-free smoke tests for shared helpers (tsx not required).
const require = createRequire(import.meta.url);

// Inline mirrors of the TypeScript helpers so tests run without a TS loader.
function outputText(result) {
  if (typeof result.output_text === "string" && result.output_text.trim()) return result.output_text;
  if (!Array.isArray(result.output)) return "";
  return result.output.flatMap((item) => {
    if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) return [];
    return item.content.flatMap((content) =>
      content && typeof content === "object" && "text" in content && typeof content.text === "string" ? [content.text] : [],
    );
  }).join("");
}

function validUuid(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

describe("outputText", () => {
  it("prefers output_text", () => {
    assert.equal(outputText({ output_text: "hello", output: [] }), "hello");
  });
  it("walks structured output content", () => {
    assert.equal(outputText({
      output: [{ content: [{ text: '{"instagram":"a"}' }] }],
    }), '{"instagram":"a"}');
  });
  it("returns empty when nothing usable", () => {
    assert.equal(outputText({}), "");
  });
});

describe("validUuid", () => {
  it("rejects mock interview day id 1", () => {
    assert.equal(validUuid("1"), false);
  });
  it("accepts a real uuid", () => {
    assert.equal(validUuid("a7171ec5-5c08-4624-b10a-f6a010975c67"), true);
  });
});

void require;
