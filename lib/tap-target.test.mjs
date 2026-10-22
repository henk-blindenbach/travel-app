import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { meetsMinTapTarget, MIN_TAP_TARGET_PX } from "./tap-target.ts";

describe("meetsMinTapTarget", () => {
  it("requires at least 44×44", () => {
    assert.equal(MIN_TAP_TARGET_PX, 44);
    assert.equal(meetsMinTapTarget(44, 44), true);
    assert.equal(meetsMinTapTarget(43, 44), false);
    assert.equal(meetsMinTapTarget(44, 30), false);
    assert.equal(meetsMinTapTarget(48, 48), true);
  });
});
