import { test } from "node:test";
import assert from "node:assert/strict";
import { packageDetailDrafts } from "../db/packageDetailDrafts.js";

test("package detail drafts preserve source dates, facilities, and prices", () => {
  assert.equal(packageDetailDrafts.length, 2);
  assert.deepEqual(
    packageDetailDrafts.map((draft) => draft.departureDate),
    ["2026-11-14", "2026-10-30"],
  );

  for (const draft of packageDetailDrafts) {
    assert.equal(draft.duration, 12);
    assert.equal(draft.airlineCode, "EK");
    assert.equal(draft.arrivalAirportCode, "JED");
    assert.equal(draft.returnAirportCode, "JED");
    assert.ok(draft.facilities.length >= 7);
    assert.match(draft.facilities.join(" "), /tensi darah/);
    assert.match(draft.facilities.join(" "), /gula darah/);
    assert.match(draft.facilities.join(" "), /vitamin booster/);

    for (const option of draft.options) {
      assert.ok(option.priceQuad <= option.priceTriple);
      assert.ok(option.priceTriple <= option.priceDouble);
    }
  }

  const dubai = packageDetailDrafts.find((draft) => draft.code.includes("DXB"));
  const turkey = packageDetailDrafts.find((draft) => draft.code.includes("TRK"));
  assert.equal(dubai.options.length, 2);
  assert.equal(turkey.options.length, 1);
  assert.match(dubai.facilities.join(" "), /Grand Kingsgate Hotel Waterfront/);
  assert.match(turkey.facilities.join(" "), /Park Inn Radisson/);
});
