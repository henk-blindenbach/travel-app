import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { offlineDocumentsIntro } from "./offline-document-copy.ts";

describe("offlineDocumentsIntro", () => {
  it("uses live total and saved counts without requiring a reload", () => {
    assert.match(offlineDocumentsIntro(10, 0), /alle 10 documenten/);
    assert.doesNotMatch(offlineDocumentsIntro(10, 0), /staan nu lokaal/);
    assert.match(offlineDocumentsIntro(11, 3), /alle 11 documenten/);
    assert.match(offlineDocumentsIntro(11, 3), /3 documenten staan nu lokaal klaar/);
  });

  it("singularizes one document / one local copy", () => {
    assert.match(offlineDocumentsIntro(1, 1), /alle 1 document /);
    assert.match(offlineDocumentsIntro(1, 1), /1 document staat nu lokaal klaar/);
  });
});
