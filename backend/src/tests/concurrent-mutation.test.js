import { test } from "node:test";
import assert from "node:assert/strict";
import { concurrentMutation } from "../utils/concurrentMutation.js";
import { decemberPackageSchedules } from "../db/decemberPackageSchedules.js";

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});
const request = (body, userId = 1) => ({ body, params: { bookingNumber: "SQ1" }, user: { userId } });

test("identical concurrent requests execute once, later submissions execute again", async () => {
  let count = 0;
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const handler = concurrentMutation(async (_req, res) => {
    count++;
    await gate;
    res.status(201).json({ id: count });
  });
  const a = response();
  const b = response();
  const first = handler(request({ amount: 100, proofUrl: "a" }), a, assert.fail);
  const second = handler(request({ proofUrl: "a", amount: 100 }), b, assert.fail);
  release();
  await Promise.all([first, second]);
  assert.equal(count, 1);
  assert.deepEqual(a.body, b.body);
  assert.equal(b.statusCode, 201);
  await handler(request({ amount: 100, proofUrl: "a" }), response(), assert.fail);
  assert.equal(count, 2);
});

test("different payment proofs and users are never collapsed", async () => {
  let count = 0;
  const handler = concurrentMutation(async (_req, res) => {
    count++;
    await new Promise((resolve) => setTimeout(resolve, 5));
    res.json({ id: count });
  });
  await Promise.all([
    handler(request({ amount: 100, proofUrl: "a" }), response(), assert.fail),
    handler(request({ amount: 100, proofUrl: "b" }), response(), assert.fail),
    handler(request({ amount: 100, proofUrl: "a" }, 2), response(), assert.fail),
  ]);
  assert.equal(count, 3);
});

test("a failed operation releases its slot for retry", async () => {
  let count = 0;
  const handler = concurrentMutation(async (_req, res) => {
    if (++count === 1) throw new Error("test failure");
    res.json({ ok: true });
  });
  let error;
  await handler(request({}), response(), (value) => { error = value; });
  assert.equal(error.message, "test failure");
  const res = response();
  await handler(request({}), res, assert.fail);
  assert.deepEqual(res.body, { ok: true });
});

test("December preserves all 31 rows and distinct hotel options", () => {
  const rows = decemberPackageSchedules.flatMap((list) => list.rows);
  assert.equal(rows.length, 31);
  assert.equal(rows.filter((row) => row[9] === "TIF").length, 3);
  for (const list of decemberPackageSchedules) {
    const keys = list.rows.map((row) => `${row[0]}:${row[2]}`);
    assert.equal(new Set(keys).size, keys.length);
    for (const row of list.rows) {
      assert.match(row[0], /^2026-12-\d{2}$/);
      assert.ok(row[5] <= row[6] && row[6] <= row[7]);
    }
  }
});
