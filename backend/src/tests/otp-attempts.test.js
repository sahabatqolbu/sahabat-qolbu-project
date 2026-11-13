import test from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET ??= "ci-test-jwt-secret-0123456789abcdef";
const { verifyOTP } = await import("../utils/otp.js");

const expiry = () => new Date(Date.now() + 60_000);

test("an issued OTP stops accepting guesses after three attempts", () => {
  const results = ["111111", "222222", "333333", "123456"].map(
    (guess) => verifyOTP("123456", guess, expiry(), "user:attempts-a").valid,
  );
  assert.deepEqual(results, [false, false, false, false]);
});

test("a newly issued OTP gets a fresh attempt budget", () => {
  for (const guess of ["111111", "222222", "333333"]) {
    verifyOTP("123456", guess, expiry(), "user:attempts-b");
  }
  assert.equal(verifyOTP("654321", "654321", expiry(), "user:attempts-b").valid, true);
});

test("attempts on one account do not lock another account", () => {
  for (const guess of ["111111", "222222", "333333"]) {
    verifyOTP("123456", guess, expiry(), "user:attempts-c");
  }
  assert.equal(verifyOTP("123456", "123456", expiry(), "user:attempts-d").valid, true);
});
