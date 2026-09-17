import test from "node:test";
import assert from "node:assert/strict";
import { sortPackagesForDisplay } from "../controllers/packageController.js";

test("pinned packages always appear before unpinned packages", () => {
  const packages = [
    { id: 1, name: "Paket Biasa 1", isPinned: false, departureDate: "2026-10-01", createdAt: "2026-01-01" },
    { id: 2, name: "Paket Spesial Pinned", isPinned: true, pinnedOrder: 1, departureDate: "2026-12-01", createdAt: "2026-01-02" },
    { id: 3, name: "Paket Biasa 2", isPinned: false, departureDate: "2026-09-20", createdAt: "2026-01-03" },
  ];

  const sorted = sortPackagesForDisplay(packages);
  assert.equal(sorted[0].id, 2);
  assert.equal(sorted[0].isPinned, true);
});

test("multiple pinned packages are ordered by pinnedOrder ascending", () => {
  const packages = [
    { id: 1, name: "Pinned Rank 3", isPinned: true, pinnedOrder: 3, departureDate: "2026-10-01" },
    { id: 2, name: "Pinned Rank 1", isPinned: true, pinnedOrder: 1, departureDate: "2026-11-01" },
    { id: 3, name: "Pinned Rank 2", isPinned: true, pinnedOrder: 2, departureDate: "2026-12-01" },
    { id: 4, name: "Regular Package", isPinned: false, departureDate: "2026-09-01" },
  ];

  const sorted = sortPackagesForDisplay(packages);
  assert.deepEqual(sorted.map((p) => p.id), [2, 3, 1, 4]);
});

test("unpinned packages maintain normal departure/freshness sorting after pinned", () => {
  const packages = [
    { id: 10, name: "Unpinned Late", isPinned: false, departureDate: "2026-11-15", bookingStatus: "OPEN" },
    { id: 20, name: "Pinned #1", isPinned: true, pinnedOrder: 1, departureDate: "2026-12-20", bookingStatus: "OPEN" },
    { id: 30, name: "Unpinned Early", isPinned: false, departureDate: "2026-10-05", bookingStatus: "OPEN" },
  ];

  const sorted = sortPackagesForDisplay(packages);
  assert.equal(sorted[0].id, 20); // Pinned is 1st
  assert.equal(sorted[1].id, 30); // Earlier departure is 2nd
  assert.equal(sorted[2].id, 10); // Later departure is 3rd
});
