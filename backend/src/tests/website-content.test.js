import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeContent } from "../controllers/siteContentController.js";
import {
  parseHeroPayload,
  safeCtaUrl,
} from "../controllers/heroSlideController.js";

test("site content keeps text and drops unsafe image and link values", () => {
  const cleaned = sanitizeContent({
    hero: {
      headline: "  Ibadah lebih tenang  ",
      photoUrl: "javascript:alert(1)",
      imageUrl: "/uploads/site-content/a.webp",
      ctaLink: "data:text/html,x",
    },
    items: [{ title: "Satu", photo: "https://cdn.example.com/a.jpg" }],
    "bad key": "x",
    __proto__: { polluted: true },
  });

  assert.equal(cleaned.hero.headline, "Ibadah lebih tenang");
  assert.equal(cleaned.hero.photoUrl, "");
  assert.equal(cleaned.hero.imageUrl, "/uploads/site-content/a.webp");
  assert.equal(cleaned.hero.ctaLink, "");
  assert.equal(cleaned.items[0].photo, "https://cdn.example.com/a.jpg");
  assert.equal("bad key" in cleaned, false);
  assert.equal({}.polluted, undefined);
});

test("site content caps long strings and arrays", () => {
  const cleaned = sanitizeContent({
    long: "a".repeat(10_000),
    list: Array.from({ length: 100 }, (_, i) => String(i)),
  });
  assert.equal(cleaned.long.length, 4000);
  assert.equal(cleaned.list.length, 40);
});

test("hero CTA links only allow https and internal paths", () => {
  assert.equal(safeCtaUrl("/paket"), "/paket");
  assert.equal(safeCtaUrl("https://wa.me/6281"), "https://wa.me/6281");
  assert.equal(safeCtaUrl(""), null);
  assert.equal(safeCtaUrl("//evil.com"), undefined);
  assert.equal(safeCtaUrl("javascript:alert(1)"), undefined);
  assert.equal(safeCtaUrl("http://plain.example.com"), undefined);
});

test("hero payload normalizes kind, background and package", () => {
  const parsed = parseHeroPayload({
    kind: "promo",
    background: "clock",
    packageId: "22",
    tag: "Promo early bird",
    sortOrder: "5000",
  });
  assert.equal(parsed.kind, "PROMO");
  assert.equal(parsed.background, "CLOCK");
  assert.equal(parsed.packageId, 22);
  assert.equal(parsed.sortOrder, 999);

  const invalid = parseHeroPayload({ kind: "video", background: "neon" });
  assert.equal(invalid.kind, null);
  assert.equal(invalid.background, null);
});
