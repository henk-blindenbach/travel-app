import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePublicStoryBlocks } from "./public-story.ts";

describe("parsePublicStoryBlocks", () => {
  it("keeps plain paragraphs as one body size voice", () => {
    const blocks = parsePublicStoryBlocks("Eerste alinea.\n\nTweede alinea.");
    assert.deepEqual(blocks, [
      { type: "paragraph", text: "Eerste alinea." },
      { type: "paragraph", text: "Tweede alinea." },
    ]);
  });

  it("splits ## heading from following body when only one newline separates them", () => {
    const blocks = parsePublicStoryBlocks(
      "## Een warm ontvangst\nWij werden in Lhasa omringd.\n\n## Door de stad\nHarry leidde ons.",
    );
    assert.deepEqual(blocks, [
      { type: "heading", text: "Een warm ontvangst" },
      { type: "paragraph", text: "Wij werden in Lhasa omringd." },
      { type: "heading", text: "Door de stad" },
      { type: "paragraph", text: "Harry leidde ons." },
    ]);
  });

  it("supports classic ## heading blocks separated by blank lines", () => {
    const blocks = parsePublicStoryBlocks("## Titel\n\nBody tekst hier.");
    assert.deepEqual(blocks, [
      { type: "heading", text: "Titel" },
      { type: "paragraph", text: "Body tekst hier." },
    ]);
  });
});
