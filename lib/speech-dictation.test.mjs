import assert from "node:assert/strict";
import { describe, it } from "node:test";

function assembleSpeechTranscript(results) {
  const parts = [];
  for (let index = 0; index < results.length; index += 1) {
    const text = results[index]?.[0]?.transcript?.trim();
    if (text) parts.push(text);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function mergeDictationDraft(base, sessionText) {
  const left = base.trim();
  const right = sessionText.trim();
  if (!left) return right;
  if (!right) return left;
  if (right.startsWith(left)) return right;
  const needsSpace = !/\s$/.test(left) && !/^[,.;:!?]/.test(right);
  return `${left}${needsSpace ? " " : ""}${right}`;
}

describe("assembleSpeechTranscript", () => {
  it("joins consecutive final result blocks", () => {
    const results = [
      { isFinal: true, 0: { transcript: "Eerste blok over de ochtend." } },
      { isFinal: true, 0: { transcript: "Tweede blok over de lunch." } },
    ];
    assert.equal(
      assembleSpeechTranscript(results),
      "Eerste blok over de ochtend. Tweede blok over de lunch.",
    );
  });

  it("keeps the latest interim after finals", () => {
    const results = [
      { isFinal: true, 0: { transcript: "Eerste zin." } },
      { isFinal: false, 0: { transcript: "tweede" } },
    ];
    assert.equal(assembleSpeechTranscript(results), "Eerste zin. tweede");
  });
});

describe("mergeDictationDraft", () => {
  it("appends a second dictation session without wiping the first", () => {
    assert.equal(
      mergeDictationDraft("Eerste blok over de ochtend.", "Tweede blok over de lunch."),
      "Eerste blok over de ochtend. Tweede blok over de lunch.",
    );
  });

  it("does not duplicate when session already contains the base", () => {
    assert.equal(
      mergeDictationDraft("Hallo", "Hallo wereld"),
      "Hallo wereld",
    );
  });

  it("preserves base when session is still empty", () => {
    assert.equal(mergeDictationDraft("Bewaar dit", ""), "Bewaar dit");
  });

  it("after a cleared base, only the new utterance remains", () => {
    assert.equal(mergeDictationDraft("", "Nieuw blok na wissen."), "Nieuw blok na wissen.");
  });

  it("after a corrected base, appends the next utterance without restoring the old wording", () => {
    assert.equal(
      mergeDictationDraft("Gecorrigeerde zin.", "Extra detail."),
      "Gecorrigeerde zin. Extra detail.",
    );
  });
});
