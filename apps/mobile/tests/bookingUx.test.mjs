import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { classifyBookingFailure } from "../src/services/bookingUx.ts";

test("ordinary availability and validation network failures remain safely retryable", () => {
  assert.equal(classifyBookingFailure(new TypeError("offline"), "availability").kind, "network");
  assert.equal(classifyBookingFailure({ code: "NETWORK_UNAVAILABLE" }, "prepare").kind, "network");
});

test("invoice transport failures and server uncertainty are terminal do-not-retry outcomes", () => {
  for (const error of [new TypeError("connection lost"), { code: "NETWORK_UNAVAILABLE" }, { code: "OUTCOME_UNCERTAIN" }]) {
    const result = classifyBookingFailure(error, "invoice");
    assert.equal(result.kind, "uncertain");
    assert.match(result.message, /Do not retry/);
    assert.match(result.message, /Do not.*payment/i);
    assert.match(result.message, /resort is checking/i);
  }
});

test("stale prices force revalidation and disabled execution states have honest copy", () => {
  assert.equal(classifyBookingFailure({ code: "NO_LONGER_AVAILABLE" }, "invoice").kind, "stale");
  const disabled = classifyBookingFailure({ code: "EXECUTION_DISABLED" }, "invoice");
  assert.equal(disabled.kind, "disabled");
  assert.match(disabled.message, /No booking, hold, or payment was created/);
});

test("BookingScreen locks uncertain submissions and persists only through secure storage", () => {
  const screen = readFileSync(new URL("../src/screens/BookingScreen.tsx", import.meta.url), "utf8");
  const storage = readFileSync(new URL("../src/services/bookingDraftStorage.ts", import.meta.url), "utf8");
  assert.match(screen, /keepLocked = true/);
  assert.match(screen, /status: "uncertain"/);
  assert.match(screen, /Please do not retry/);
  assert.match(screen, /Do not open a payment link or attempt payment/);
  assert.match(screen, /Room availability and prices were not restored; search and validate them again/);
  assert.match(storage, /expo-secure-store/);
  assert.match(storage, /WHEN_UNLOCKED_THIS_DEVICE_ONLY/);
  assert.doesNotMatch(storage, /AsyncStorage|accessToken|refreshToken|password/);
});

test("My Stays still excludes every incomplete durable processing state", () => {
  const handler = readFileSync(new URL("../../admin/lib/guestHistory/handler.ts", import.meta.url), "utf8");
  assert.match(handler, /record\.processingState === 'invoice_created'/);
});

test("all guest menu destinations avoid the generic placeholder", () => {
  const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
  for (const route of ["dining", "activities", "spa", "map", "attractions", "reviews", "tripadvisor", "google-review", "coupon", "gallery", "contact", "history", "login", "employee-login", "delete-account"]) {
    assert.match(app, new RegExp(`screen === '${route}'`));
  }
  assert.match(app, /screen === 'delete-account'[\s\S]{0,160}<AccountDeletionScreen/);
});
