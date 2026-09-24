import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const controllerUrl = new URL("../controllers/bankController.js", import.meta.url);

test("bank mutations use MySQL-compatible result handling", async () => {
  const source = await readFile(controllerUrl, "utf8");

  assert.doesNotMatch(source, /\.returning\s*\(/);
  assert.match(source, /\.\$returningId\s*\(\)/);
  assert.match(source, /\.where\(eq\(masterBanks\.id, created\.id\)\)/);
});
