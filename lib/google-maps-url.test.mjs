import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isAllowedMapsExpandHost,
  isGoogleMapsShortLink,
  parseGoogleMapsUrl,
} from "./google-maps-url.ts";

describe("parseGoogleMapsUrl", () => {
  it("parses q=lat,lng", () => {
    const parsed = parseGoogleMapsUrl("https://www.google.com/maps?q=27.7172,85.3240");
    assert.deepEqual(parsed, { latitude: 27.7172, longitude: 85.324 });
  });

  it("parses @lat,lng in the path", () => {
    const parsed = parseGoogleMapsUrl("https://www.google.com/maps/@27.7172,85.3240,15z");
    assert.equal(parsed?.latitude, 27.7172);
    assert.equal(parsed?.longitude, 85.324);
  });

  it("parses place pins with @ and optional name", () => {
    const parsed = parseGoogleMapsUrl(
      "https://www.google.com/maps/place/Durbar+Square/@27.7045,85.3072,17z",
    );
    assert.equal(parsed?.latitude, 27.7045);
    assert.equal(parsed?.longitude, 85.3072);
    assert.equal(parsed?.placeName, "Durbar Square");
  });

  it("prefers !3d/!4d marker over @ viewport", () => {
    const parsed = parseGoogleMapsUrl(
      "https://www.google.com/maps/place/Foo/@27.7,85.3,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d27.7172!4d85.3240",
    );
    assert.equal(parsed?.latitude, 27.7172);
    assert.equal(parsed?.longitude, 85.324);
  });

  it("accepts maps.google.com and pasted text with surrounding words", () => {
    const parsed = parseGoogleMapsUrl("Pin: https://maps.google.com/?q=27.3825,89.2850 thanks");
    assert.equal(parsed?.latitude, 27.3825);
    assert.equal(parsed?.longitude, 89.285);
  });

  it("returns null for place-only q without coords", () => {
    assert.equal(parseGoogleMapsUrl("https://www.google.com/maps?q=Kathmandu+Durbar+Square"), null);
  });

  it("returns null for non-Google URLs", () => {
    assert.equal(parseGoogleMapsUrl("https://openstreetmap.org/#map=15/27.7/85.3"), null);
  });

  it("rejects out-of-range coordinates", () => {
    assert.equal(parseGoogleMapsUrl("https://www.google.com/maps?q=120,85"), null);
  });
});

describe("isGoogleMapsShortLink", () => {
  it("detects maps.app.goo.gl and goo.gl/maps", () => {
    assert.equal(isGoogleMapsShortLink("https://maps.app.goo.gl/AbCdEf"), true);
    assert.equal(isGoogleMapsShortLink("https://goo.gl/maps/AbCdEf"), true);
    assert.equal(isGoogleMapsShortLink("https://www.google.com/maps?q=1,2"), false);
  });
});

describe("isAllowedMapsExpandHost", () => {
  it("allows Google Maps hosts and regional google TLDs", () => {
    assert.equal(isAllowedMapsExpandHost("maps.app.goo.gl"), true);
    assert.equal(isAllowedMapsExpandHost("www.google.com"), true);
    assert.equal(isAllowedMapsExpandHost("google.nl"), true);
    assert.equal(isAllowedMapsExpandHost("evil.example"), false);
  });
});
