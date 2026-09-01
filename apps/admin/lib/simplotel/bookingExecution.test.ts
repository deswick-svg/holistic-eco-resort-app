import assert from "node:assert/strict";
import test from "node:test";
import {
  BookingExecutionError,
  BookingSubmissionRegistry,
  isDirectBookingEnabled,
  isFullOnlinePaymentEnabled,
  postToSimplotel,
  requireBookingCreationEnabled,
} from "./bookingExecution.ts";
import type { SimplotelInvoicePayload } from "./bookingPreparation.ts";

const payload = {
  checkIn: "2026-10-10",
  checkOut: "2026-10-12",
  propertyId: 7849,
  advanceAmount: 1380,
  advancePercentage: 100,
  holdInventory: { enabled: true, value: 24, unit: "HOURS" },
  quoteInfo: {
    checkInDate: "2026-10-10",
    checkOutDate: "2026-10-12",
    customerDetail: {
      name: "Test Guest",
      email: "guest@example.com",
      phone: "+919876543210",
      bookingForSelf: true,
    },
    guestDetail: null,
    guestCategory: "INDIVIDUAL",
    city: "",
    state: "",
    country: "",
    gstNumber: "",
    discount: null,
  },
  lineItems: [],
} satisfies SimplotelInvoicePayload;

test("full payment and direct booking use separate disabled-by-default flags", () => {
  assert.equal(isFullOnlinePaymentEnabled(undefined), false);
  assert.equal(isFullOnlinePaymentEnabled("false"), false);
  assert.equal(isFullOnlinePaymentEnabled("TRUE"), false);
  assert.equal(isFullOnlinePaymentEnabled("true"), true);
  assert.equal(isDirectBookingEnabled(undefined), false);
  assert.equal(isDirectBookingEnabled("false"), false);

  let calls = 0;
  assert.throws(
    () => {
      requireBookingCreationEnabled(false);
      calls += 1;
    },
    (error: unknown) =>
      error instanceof BookingExecutionError &&
      error.code === "EXECUTION_DISABLED"
  );
  assert.equal(calls, 0);
});

test("duplicate submissions share one operation", async () => {
  const registry = new BookingSubmissionRegistry();
  let calls = 0;
  const operation = () => {
    calls += 1;
    return Promise.resolve({ booking_id: "BOOK1", quote_id: "QUOTE1" });
  };
  const first = registry.run("mobile_duplicate_123", operation);
  const second = registry.run("mobile_duplicate_123", operation);
  assert.equal(first, second);
  assert.deepEqual(await first, { booking_id: "BOOK1", quote_id: "QUOTE1" });
  assert.equal(calls, 1);
});

test("an in-flight submission is never evicted by registry capacity", async () => {
  const registry = new BookingSubmissionRegistry(60_000, 1);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let firstCalls = 0;
  const first = registry.run("mobile_inflight_123", async () => {
    firstCalls += 1;
    await pending;
    return "first";
  });
  await registry.run("mobile_second_1234", async () => "second");
  const duplicate = registry.run("mobile_inflight_123", async () => {
    firstCalls += 1;
    return "duplicate";
  });
  assert.equal(first, duplicate);
  release();
  assert.equal(await duplicate, "first");
  assert.equal(firstCalls, 1);
});

test("an uncertain submission is cached and not sent again", async () => {
  const registry = new BookingSubmissionRegistry();
  let calls = 0;
  const operation = () => {
    calls += 1;
    return postToSimplotel({
      endpoint: "send-invoice",
      hotelId: 7849,
      accessToken: "server-test-token",
      payload,
      fetcher: async () => {
        throw new Error("connection lost");
      },
    });
  };
  await assert.rejects(registry.run("mobile_uncertain_123", operation));
  await assert.rejects(registry.run("mobile_uncertain_123", operation));
  assert.equal(calls, 1);
});

test("valid send-invoice response preserves all documented identifiers", async () => {
  let requestBody = "";
  const confirmation = await postToSimplotel({
    endpoint: "send-invoice",
    hotelId: 7849,
    accessToken: "server-test-token",
    payload,
    fetcher: async (_url, init) => {
      requestBody = String(init?.body);
      return Response.json({
        booking_id: "KMDXCM",
        quote_id: "QMHIFV",
        invoice_id: 12345,
      });
    },
  });
  assert.deepEqual(confirmation, {
    booking_id: "KMDXCM",
    quote_id: "QMHIFV",
    invoice_id: 12345,
  });
  assert.deepEqual(JSON.parse(requestBody), payload);
});

test("malformed success and network uncertainty never become confirmation", async () => {
  let networkCalls = 0;
  await assert.rejects(
    postToSimplotel({
      endpoint: "send-invoice",
      hotelId: 7849,
      accessToken: "server-test-token",
      payload,
      fetcher: async () => Response.json({ status: "ok" }),
    }),
    (error: unknown) =>
      error instanceof BookingExecutionError &&
      error.code === "OUTCOME_UNCERTAIN"
  );
  await assert.rejects(
    postToSimplotel({
      endpoint: "send-invoice",
      hotelId: 7849,
      accessToken: "server-test-token",
      payload,
      fetcher: async () => {
        networkCalls += 1;
        throw new Error("socket closed");
      },
    }),
    (error: unknown) =>
      error instanceof BookingExecutionError &&
      error.code === "OUTCOME_UNCERTAIN"
  );
  assert.equal(networkCalls, 1);
});

test("sold-out Simplotel error is mapped to a reviewable conflict", async () => {
  await assert.rejects(
    postToSimplotel({
      endpoint: "send-invoice",
      hotelId: 7849,
      accessToken: "server-test-token",
      payload,
      fetcher: async () =>
        Response.json(
          { error: { message: "no rooms available online for the dates" } },
          { status: 409 }
        ),
    }),
    (error: unknown) =>
      error instanceof BookingExecutionError &&
      error.code === "NO_LONGER_AVAILABLE" &&
      error.status === 409
  );
});

test("failed invoice and missing invoice identifier are rejected", async () => {
  await assert.rejects(
    postToSimplotel({
      endpoint: "send-invoice",
      hotelId: 7849,
      accessToken: "server-test-token",
      payload,
      fetcher: async () =>
        Response.json(
          { error: { message: "Phone number is not valid" } },
          { status: 400 }
        ),
    }),
    (error: unknown) =>
      error instanceof BookingExecutionError &&
      error.code === "SIMPLOTEL_REJECTED"
  );
  await assert.rejects(
    postToSimplotel({
      endpoint: "send-invoice",
      hotelId: 7849,
      accessToken: "server-test-token",
      payload,
      fetcher: async () =>
        Response.json({ booking_id: "KMDXCM", quote_id: "QMHIFV" }),
    }),
    (error: unknown) =>
      error instanceof BookingExecutionError &&
      error.code === "OUTCOME_UNCERTAIN"
  );
});
