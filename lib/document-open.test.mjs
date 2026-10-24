import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  contentDispositionForDocument,
  contentDispositionInline,
  documentFilePath,
  isInlineDocumentMime,
} from "./document-open.ts";

describe("documentFilePath", () => {
  it("builds the same-origin file route", () => {
    assert.equal(
      documentFilePath("11111111-1111-1111-1111-111111111111"),
      "/api/documents/11111111-1111-1111-1111-111111111111/file",
    );
  });
});

describe("isInlineDocumentMime", () => {
  it("treats PDF and images as inline", () => {
    assert.equal(isInlineDocumentMime("application/pdf"), true);
    assert.equal(isInlineDocumentMime("image/jpeg"), true);
    assert.equal(isInlineDocumentMime("image/heic"), true);
    assert.equal(isInlineDocumentMime("application/vnd.openxmlformats-officedocument.wordprocessingml.document"), false);
  });
});

describe("contentDispositionForDocument", () => {
  it("uses inline for PDF/images and attachment for office files", () => {
    assert.match(contentDispositionInline("ticket.pdf"), /^inline; filename\*=UTF-8''/);
    assert.match(contentDispositionForDocument("application/pdf", "ticket café.pdf"), /^inline;/);
    assert.match(
      contentDispositionForDocument(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "plan.xlsx",
      ),
      /^attachment;/,
    );
  });
});
