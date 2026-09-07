import assert from "node:assert/strict";
import test from "node:test";
import {
  BookingReconciliationError,
  getSimplotelBookingDetails,
  parseBookingDetailsResponse,
} from "./bookingReconciliation.ts";

const observed = {
  booking: {
    bookingId: "TISXLT",
    propertyId: 7849,
    checkIn: "2026-10-05",
    checkOut: "2026-10-06",
    totalAmount: "5775.0000",
    amountPaid: "0.0000",
    status: "FAILED",
    refundAmount: "0.0000",
    pgTransactionID: null,
    guestDetails: { name: "must-not-leak", email: "private@example.com" },
    payLaterDetails: {
      paymentRequired: false,
      paymentRemaining: 0,
      autoCancelTime: "",
      additionalRemaining: 0,
      payLinkKey: "",
    },
    roomContent: { arbitrary: "must-not-leak" },
  },
  content: { arbitrary: "must-not-leak" },
};

test("observed FAILED booking maps to reconciled failed with no payment collected", () => {
  const result = parseBookingDetailsResponse(observed, "TISXLT");
  assert.deepEqual(result, {
    bookingId: "TISXLT",
    propertyId: 7849,
    checkIn: "2026-10-05",
    checkOut: "2026-10-06",
    totalAmount: "5775.0000",
    amountPaid: "0.0000",
    refundAmount: "0.0000",
    providerBookingStatus: "FAILED",
    paymentTransactionId: null,
    paymentLinkAvailable: false,
    processingState: "reconciled_failed",
    bookingStatus: "failed",
    paymentStatus: "not_collected",
  });
  assert.doesNotMatch(JSON.stringify(result), /must-not-leak|private@example/);
});

test("unknown provider states stay manual-review and are never guessed", () => {
  const result = parseBookingDetailsResponse(
    { ...observed, booking: { ...observed.booking, status: "SOMETHING_NEW" } },
    "TISXLT",
  );
  assert.equal(result.processingState, "manual_review");
  assert.equal(result.bookingStatus, "unknown");
  assert.equal(result.paymentStatus, "unknown");
});

test("transport sends exactly one form-encoded read request and no mutation", async () => {
  let calls = 0;
  const result = await getSimplotelBookingDetails({
    bookingId: "TISXLT",
    accessToken: "mock-token",
    fetcher: async (url, init) => {
      calls += 1;
      assert.equal(String(url), "https://bookings.simplotel.com/payment/get_booking_details");
      assert.equal(init?.method, "POST");
      assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer mock-token");
      assert.equal((init?.headers as Record<string, string>)["Content-Type"], "application/x-www-form-urlencoded");
      assert.equal(String(init?.body), "bookingId=TISXLT");
      return Response.json(observed);
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.processingState, "reconciled_failed");
});

test("mismatched IDs, malformed responses and provider errors fail closed", async () => {
  assert.throws(
    () => parseBookingDetailsResponse(observed, "OTHER"),
    (error: unknown) => error instanceof BookingReconciliationError && error.code === "UNREADABLE_RESPONSE",
  );
  await assert.rejects(
    getSimplotelBookingDetails({
      bookingId: "TISXLT",
      accessToken: "mock-token",
      fetcher: async () => new Response("not-json", { status: 200 }),
    }),
    (error: unknown) => error instanceof BookingReconciliationError && error.code === "UNREADABLE_RESPONSE",
  );
  await assert.rejects(
    getSimplotelBookingDetails({
      bookingId: "TISXLT",
      accessToken: "mock-token",
      fetcher: async () => Response.json({ error: { message: "not found" } }, { status: 404 }),
    }),
    (error: unknown) => error instanceof BookingReconciliationError && error.code === "PROVIDER_REJECTED",
  );
});
