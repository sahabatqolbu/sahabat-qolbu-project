import { test } from "node:test";
import assert from "node:assert/strict";
import { packageDetailDrafts } from "../db/packageDetailDrafts.js";

test("package detail drafts preserve source dates, facilities, and prices", () => {
  assert.equal(packageDetailDrafts.length, 7);
  assert.deepEqual(
    packageDetailDrafts.map((draft) => draft.departureDate),
    ["2027-02-22", "2027-02-07", "2026-11-14", "2026-10-30", "2026-11-04", "2026-11-06", "2026-11-27"],
  );

  for (const draft of packageDetailDrafts) {
    assert.ok([9, 12, 17].includes(draft.duration));
    assert.ok(["EK", "SV", "QR"].includes(draft.airlineCode));
    assert.ok(["JED", "MED"].includes(draft.arrivalAirportCode));
    assert.ok(["JED", "MED"].includes(draft.returnAirportCode));
    assert.ok(draft.facilities.length >= 7);
    if (draft.airlineCode === "EK") {
      assert.match(draft.facilities.join(" "), /tensi darah/);
      assert.match(draft.facilities.join(" "), /gula darah/);
      assert.match(draft.facilities.join(" "), /vitamin booster/);
    }

    for (const option of draft.options) {
      // Triple/Double of 0 means the source material had no price yet.
      if (!option.priceTriple || !option.priceDouble) continue;
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

  const mahabbah = packageDetailDrafts.find((draft) => draft.code.includes("NOV-MHB"));
  assert.equal(mahabbah.duration, 9);
  assert.equal(mahabbah.airlineCode, "SV");
  assert.deepEqual(mahabbah.options[0], {
    name: "Pilihan Utama - Winner Inn / Nada Ajyad - ODST / Triple One",
    priceQuad: 27.5,
    priceTriple: 29.5,
    priceDouble: 31.5,
  });
  assert.match(mahabbah.facilities.join(" "), /Winner Inn/);

  const lateNovember = packageDetailDrafts.find((draft) => draft.code.includes("NOV-MHB-FAMILY-SMART-20261127"));
  assert.equal(lateNovember.returnDate, "2026-12-05");
  assert.equal(lateNovember.duration, 9);
  assert.deepEqual(lateNovember.options[0], mahabbah.options[0]);
});

test("Lailatul Qadar plus Lebaran draft keeps the early bird price and hotels", () => {
  const draft = packageDetailDrafts.find((item) => item.code === "SQ-LQ-LEBARAN-MKH-20270222");
  assert.ok(draft);
  assert.equal(draft.departureDate, "2027-02-22");
  assert.equal(draft.returnDate, "2027-03-10");
  assert.equal(draft.duration, 17);
  assert.equal(draft.airlineCode, "QR");
  assert.equal(draft.normalPrice, 49.9);
  assert.equal(draft.options[0].priceQuad, 48.9);
  assert.equal(draft.options[0].priceTriple, 54.6);
  assert.equal(draft.options[0].priceDouble, 65.3);
  assert.equal(draft.hotelMakkahName, "Nada Ajyad");
  assert.equal(draft.hotelMadinahName, "ABRAJ TABA");
  assert.match(draft.facilities.join(" "), /Kereta Cepat Haramain/);
});
