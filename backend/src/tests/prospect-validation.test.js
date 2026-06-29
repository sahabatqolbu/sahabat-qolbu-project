import test from "node:test";
import assert from "node:assert/strict";
import { prospectSchemas } from "../validators/index.js";

test("prospect interest validates package id and action", () => {
  const parsed = prospectSchemas.interest.parse({
    packageId: "12",
    actionType: "SAVED",
    sourcePath: "/calon-jamaah/paket/example",
  });

  assert.equal(parsed.packageId, 12);
  assert.equal(parsed.actionType, "SAVED");
});

test("prospect follow up rejects invalid status", () => {
  assert.throws(() =>
    prospectSchemas.followUp.parse({
      status: "DONE",
      note: "called",
    }),
  );
});
