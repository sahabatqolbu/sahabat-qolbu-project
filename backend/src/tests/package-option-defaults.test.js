import test from "node:test";
import assert from "node:assert/strict";
import {
  getPackageBookingState,
  normalizePackageOptionsWithDefaults,
} from "../controllers/packageController.js";

const readyPackage = {
  departureDate: "2026-10-01",
  returnDate: "2026-10-10",
  totalSeats: 45,
  priceQuad: "35000000",
  airlineId: 1,
  hotelMakkahId: 1,
  hotelMadinahId: 2,
  airlineStatus: "CONFIRMED",
  hotelMakkahStatus: "CONFIRMED",
  hotelMadinahStatus: "CONFIRMED",
};

test("package becomes Last Call when only one to five seats remain", () => {
  const state = getPackageBookingState({
    pkg: readyPackage,
    remainingSeats: 5,
    daysUntilDeparture: 30,
  });

  assert.equal(state.bookingStatus, "LAST_CALL");
  assert.equal(state.isBookable, true);
  assert.match(state.bookingStatusLabel, /Sisa 5 Seat/);
});

test("Last Call never overrides close or sold out rules", () => {
  assert.equal(
    getPackageBookingState({
      pkg: readyPackage,
      remainingSeats: 5,
      daysUntilDeparture: 7,
    }).bookingStatus,
    "CLOSED",
  );
  assert.equal(
    getPackageBookingState({
      pkg: readyPackage,
      remainingSeats: 0,
      daysUntilDeparture: 30,
    }).bookingStatus,
    "SOLD_OUT",
  );
});

test("manualBookingStatus SOLD_OUT overrides available seats", () => {
  const state = getPackageBookingState({
    pkg: { ...readyPackage, manualBookingStatus: "SOLD_OUT" },
    remainingSeats: 25,
    daysUntilDeparture: 30,
  });
  assert.equal(state.bookingStatus, "SOLD_OUT");
  assert.equal(state.isBookable, false);
});

test("manualBookingStatus CLOSED overrides booking status", () => {
  const state = getPackageBookingState({
    pkg: { ...readyPackage, manualBookingStatus: "CLOSED" },
    remainingSeats: 25,
    daysUntilDeparture: 30,
  });
  assert.equal(state.bookingStatus, "CLOSED");
  assert.equal(state.isBookable, false);
});

test("manualBookingStatus OPEN cannot bypass zero remaining seats", () => {
  const state = getPackageBookingState({
    pkg: { ...readyPackage, manualBookingStatus: "OPEN" },
    remainingSeats: 0,
    daysUntilDeparture: 30,
  });
  assert.equal(state.bookingStatus, "SOLD_OUT");
  assert.equal(state.isBookable, false);
});


const basePackage = {
  hotelMakkahId: 13,
  hotelMadinahId: 15,
  price: "43600000",
  discountPrice: "35500000",
  priceDouble: "40500000",
  priceTriple: "37350000",
  priceQuad: "35500000",
  priceQuint: "0",
};

test("default package option always follows the main package data", () => {
  const [defaultOption] = normalizePackageOptionsWithDefaults(
    [
      {
        id: 1,
        name: "Pilihan Utama",
        hotelMakkahId: 99,
        hotelMadinahId: 98,
        priceDouble: "1",
        priceTriple: "2",
        priceQuad: "3",
        isDefault: false,
        isActive: false,
      },
    ],
    basePackage,
  );

  assert.equal(defaultOption.hotelMakkahId, 13);
  assert.equal(defaultOption.hotelMadinahId, 15);
  assert.equal(defaultOption.priceDouble, "40500000.00");
  assert.equal(defaultOption.priceTriple, "37350000.00");
  assert.equal(defaultOption.priceQuad, "35500000.00");
  assert.equal(defaultOption.isDefault, true);
  assert.equal(defaultOption.isActive, true);
});

test("an empty option payload still creates one automatic default option", () => {
  const options = normalizePackageOptionsWithDefaults([], basePackage);

  assert.equal(options.length, 1);
  assert.equal(options[0].name, "Pilihan Utama");
  assert.equal(options[0].priceQuad, "35500000.00");
  assert.equal(options[0].isDefault, true);
});

test("additional options keep their own overrides", () => {
  const options = normalizePackageOptionsWithDefaults(
    [
      { id: 1, name: "Pilihan Utama" },
      {
        id: 2,
        name: "Pilihan 2",
        hotelMakkahId: 16,
        hotelMadinahId: 15,
        priceDouble: "32750000",
        priceTriple: "31500000",
        priceQuad: "30500000",
        isDefault: true,
      },
    ],
    basePackage,
  );

  assert.equal(options[0].isDefault, true);
  assert.equal(options[1].isDefault, false);
  assert.equal(options[1].hotelMakkahId, 16);
  assert.equal(options[1].priceQuad, "30500000.00");
});
