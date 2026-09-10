import test from "node:test";
import assert from "node:assert/strict";
import { getEffectiveScheduleStatus } from "../controllers/packageScheduleController.js";

test("check seat automatically closes seven days before departure", () => {
  assert.equal(
    getEffectiveScheduleStatus("CHECK_SEAT", "2026-11-10", new Date("2026-11-03T00:00:00+07:00")),
    "CLOSED",
  );
  assert.equal(
    getEffectiveScheduleStatus("CHECK_SEAT", "2026-11-10", new Date("2026-11-02T23:59:59+07:00")),
    "CHECK_SEAT",
  );
});

test("manual sold out and closed states take precedence", () => {
  const now = new Date("2026-01-01T00:00:00+07:00");
  assert.equal(getEffectiveScheduleStatus("SOLD_OUT", "2026-11-10", now), "SOLD_OUT");
  assert.equal(getEffectiveScheduleStatus("CLOSED", "2026-11-10", now), "CLOSED");
});
