import test from "node:test";
import assert from "node:assert/strict";
import { prospectSchemas } from "../validators/index.js";

test("prospect interest validates package id and action", () => {
  const parsed = prospectSchemas.interest.parse({
    packageId: "12",
    packageOptionId: "34",
    actionType: "SAVED",
    sourcePath: "/calon-jamaah/paket/example",
  });

  assert.equal(parsed.packageId, 12);
  assert.equal(parsed.packageOptionId, 34);
  assert.equal(parsed.actionType, "SAVED");
});
test("prospect interest rejects invalid package option id", () => {
  assert.throws(() =>
    prospectSchemas.interest.parse({
      packageId: 12,
      packageOptionId: 0,
      actionType: "SAVED",
    }),
  );
});

test("prospect follow up rejects invalid status", () => {
  assert.throws(() =>
    prospectSchemas.followUp.parse({
      status: "DONE",
      note: "called",
    }),
  );
});
