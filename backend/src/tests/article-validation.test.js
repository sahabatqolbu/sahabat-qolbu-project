import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { slugify, generateSlugBase, buildArticlePayload } from "../controllers/articleController.js";
import { errorHandler } from "../middlewares/errorHandler.js";

describe("article validation & payload safeguards", () => {
  it("slugify creates URL-friendly slugs", () => {
    const raw = "Arab Saudi Tindak Tegas 8 Perusahaan Umroh: Waspada Hotel!";
    const slug = slugify(raw);
    assert.equal(slug, "arab-saudi-tindak-tegas-8-perusahaan-umroh-waspada-hotel");
  });

  it("rejects article title under 3 characters", async () => {
    const result = await buildArticlePayload({
      title: "ab",
      content: "Konten artikel ini panjang dan memadai.",
    });
    assert.equal(result.error, "Judul artikel minimal 3 karakter");
  });

  it("rejects article title over 500 characters", async () => {
    const longTitle = "A".repeat(501);
    const result = await buildArticlePayload({
      title: longTitle,
      content: "Konten artikel ini panjang dan memadai.",
    });
    assert.equal(result.error, "Judul artikel maksimal 500 karakter");
  });

  it("rejects article content under 10 characters", async () => {
    const result = await buildArticlePayload({
      title: "Judul Artikel Valid",
      content: "Pendek",
    });
    assert.equal(result.error, "Konten artikel minimal 10 karakter");
  });

  it("rejects article seoTitle over 500 characters", async () => {
    const result = await buildArticlePayload({
      title: "Judul Artikel Valid",
      content: "Konten artikel ini panjang dan memadai.",
      seoTitle: "S".repeat(501),
    });
    assert.equal(result.error, "SEO Title maksimal 500 karakter");
  });

  it("truncates long slug base to safe length within 190 chars so slug fits in 255 DB limit", () => {
    const longTitle =
      "Arab Saudi Tindak Tegas 8 Perusahaan Umroh: Jamaah Diminta Waspada Hotel Tidak Berizin Catatan fakta: kasus 7 Oktober 2026 melibatkan 8 entitas, yakni 4 perusahaan layanan Umrah di Saudi dan 4 agen luar negeri, bukan delapan perusahaan Saudi. Mereka ditangguhkan setelah ditemukan pelanggaran terkait penempatan jamaah di fasilitas akomodasi yang tidak berizin.";
    
    const slugBase = generateSlugBase(longTitle);

    assert.ok(slugBase.length <= 190, `Slug length ${slugBase.length} exceeds 190`);
    assert.ok(!slugBase.endsWith("-"), "Slug should not end with trailing dash");
    assert.match(slugBase, /^[a-z0-9-]+$/);
  });

  it("errorHandler translates ER_DATA_TOO_LONG into 400 VALIDATION_FAILED", () => {
    const err = new Error("Data too long for column 'title' at row 1");
    err.code = "ER_DATA_TOO_LONG";
    err.errno = 1406;

    let responseStatus = null;
    let responseBody = null;
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      },
    };

    errorHandler(err, { path: "/api/master/articles", method: "POST" }, res, () => {});

    assert.equal(responseStatus, 400);
    assert.equal(responseBody.success, false);
    assert.equal(responseBody.code, "VALIDATION_FAILED");
    assert.match(responseBody.message, /melebihi batas panjang karakter/);
  });
});
