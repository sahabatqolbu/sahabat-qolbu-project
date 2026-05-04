import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { buildPublicAgentCta } from "../controllers/publicAgentController.js";

describe("public agent landing payload", () => {
  it("builds public CTA links from agent contact fields", () => {
    const cta = buildPublicAgentCta({
      phone: "0812-3456-7890",
      email: "agen@example.com",
    });

    assert.equal(cta.whatsapp, "https://wa.me/6281234567890");
    assert.equal(cta.email, "mailto:agen@example.com");
  });

  it("keeps missing contact fields as null", () => {
    const cta = buildPublicAgentCta({
      phone: "",
      email: "   ",
    });

    assert.equal(cta.whatsapp, null);
    assert.equal(cta.email, null);
  });
});
