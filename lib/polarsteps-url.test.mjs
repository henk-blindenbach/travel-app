import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizePolarstepsUrl } from "./polarsteps-url.ts";

describe("normalizePolarstepsUrl", () => {
  it("strips referral tracking and trailing slash noise", () => {
    assert.equal(
      normalizePolarstepsUrl(
        "https://www.polarsteps.com/221a198dx62dbx4aa4x88edx2eee0c099263/29813787-nepal-tibet-buthan-en-india?referral=true",
      ),
      "https://www.polarsteps.com/221a198dx62dbx4aa4x88edx2eee0c099263/29813787-nepal-tibet-buthan-en-india",
    );
  });

  it("returns null for empty input", () => {
    assert.equal(normalizePolarstepsUrl(""), null);
    assert.equal(normalizePolarstepsUrl("   "), null);
  });

  it("rejects non-Polarsteps hosts", () => {
    assert.throws(() => normalizePolarstepsUrl("https://evil.com/x"), /polarsteps\.com/);
  });
});
