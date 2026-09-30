import { test } from "node:test";
import assert from "node:assert/strict";
import { packageDetailDrafts } from "../db/packageDetailDrafts.js";

test("package detail drafts preserve source dates, facilities, and prices", () => {
  assert.equal(packageDetailDrafts.length, 3);
  assert.deepEqual(
    packageDetailDrafts.map((draft) => draft.departureDate),
    ["2026-11-14", "2026-10-30", "2026-11-04"],
  );

  for (const draft of packageDetailDrafts) {
    assert.ok([9, 12].includes(draft.duration));
    assert.ok(["EK", "SV"].includes(draft.airlineCode));
    assert.equal(draft.arrivalAirportCode, "JED");
    assert.equal(draft.returnAirportCode, "JED");
    assert.ok(draft.facilities.length >= 7);
    if (draft.airlineCode === "EK") {
      assert.match(draft.facilities.join(" "), /tensi darah/);
      assert.match(draft.facilities.join(" "), /gula darah/);
      assert.match(draft.facilities.join(" "), /vitamin booster/);
    }

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

  const november = packageDetailDrafts.find((draft) => draft.code.includes("NOV-PRIMA"));
  assert.equal(november.duration, 9);
  assert.equal(november.airlineCode, "SV");
  assert.deepEqual(november.options[0], {
    name: "Pilihan Utama - Al Massa Fayzeen / Mukhtara ODST",
    priceQuad: 28.9,
    priceTriple: 30.9,
    priceDouble: 32.9,
  });
  assert.match(november.facilities.join(" "), /Ayam Al-Baik/);
  assert.equal(november.registrationRequirements.length, 4);
});
