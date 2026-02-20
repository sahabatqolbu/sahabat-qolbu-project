import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { authorize } from "../middlewares/roleMiddleware.js";

const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

describe("role middleware contract", () => {
  it("returns AUTH_UNAUTHORIZED when request has no user", () => {
    const req = {};
    const res = createMockRes();
    let nextCalled = false;

    authorize(["ADMIN"])(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body?.success, false);
    assert.equal(res.body?.code, "AUTH_UNAUTHORIZED");
  });

  it("returns AUTH_FORBIDDEN when role is not allowed", () => {
    const req = {
      user: {
        userId: 999,
        role: "JAMAAH",
      },
    };
    const res = createMockRes();
    let nextCalled = false;

    authorize(["ADMIN"])(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body?.success, false);
    assert.equal(res.body?.code, "AUTH_FORBIDDEN");
  });
});
