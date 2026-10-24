import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  contentDispositionForDocument,
  contentDispositionInline,
  documentBackLabel,
  documentFilePath,
  documentViewerPath,
  isInlineDocumentMime,
  safeAppBackPath,
} from "./document-open.ts";

describe("documentFilePath", () => {
  it("builds the same-origin file route", () => {
    assert.equal(
      documentFilePath("11111111-1111-1111-1111-111111111111"),
      "/api/documents/11111111-1111-1111-1111-111111111111/file",
    );
  });
});

describe("documentViewerPath", () => {
  it("builds the in-app viewer with a safe back query", () => {
    const id = "11111111-1111-1111-1111-111111111111";
    assert.equal(documentViewerPath(id), "/app/documents/" + id);
    assert.equal(
      documentViewerPath(id, "/app/trips/abc/documents"),
      "/app/documents/" + id + "?back=" + encodeURIComponent("/app/trips/abc/documents"),
    );
    assert.equal(documentViewerPath(id, "https://evil.example/"), "/app/documents/" + id);
  });
});

describe("safeAppBackPath", () => {
  it("allows only /app relative paths", () => {
    assert.equal(safeAppBackPath("/app/today"), "/app/today");
    assert.equal(safeAppBackPath("//evil"), null);
    assert.equal(safeAppBackPath("https://evil.example/"), null);
    assert.equal(safeAppBackPath("/login"), null);
  });
});

describe("documentBackLabel", () => {
  it("picks a clear Terug label", () => {
    assert.match(documentBackLabel("/app/today"), /vandaag/i);
    assert.match(documentBackLabel("/app/trips/x/documents"), /documenten/i);
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
