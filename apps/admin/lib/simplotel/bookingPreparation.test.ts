import assert from "node:assert/strict";
import test from "node:test";
import {
  BookingPreparationError,
  InvoiceConfigurationError,
  getInvoiceInventoryHold,
  buildSimplotelBookingPayload,
  buildFullOnlineInvoicePayload,
  prepareBookingCore,
  validateBookingPreparationRequest,
  type BookingPreparationRequest,
  type SimplotelAvailabilityResponse,
} from "./bookingPreparation.ts";

const request: BookingPreparationRequest = {
  checkIn: "2026-10-10",
  checkOut: "2026-10-12",
  adults: 2,
  children: 1,
  childAge: [7],
  rooms: 2,
  selection: {
    roomTypeId: 103939,
    ratePlanId: 11976,
    occupancyId: "103939__11976__2__1",
    totalPrice: "640",
    totalTaxesAndFees: "50",
    totalAmount: 1380,
    ratePlan: {
      rate_plan_id: 11976,
      name: "Best Available Rate",
      penalty: { name: "48 hour cancellation", rules: [] },
      secondary_rate_plan_id: null,
      secondary_season_id: null,
      secondary_period_start: null,
      combined_plan: false,
    },
    occupancy: {
      id: "103939__11976__2__1",
      adults: "2",
      children: "1",
      total_price: "640",
      total_taxes_and_fees: "50",
      prices: [
        { date: "2026-10-10", total_price: "320" },
        { date: "2026-10-11", total_price: "320" },
      ],
      addons: [],
    },
  },
  customerDetail: {
    name: "Test Guest",
    email: "guest@example.com",
    phone: "+919876543210",
    bookingForSelf: true,
  },
};

const availability: SimplotelAvailabilityResponse = {
  rooms: [
    {
      room_type: 103939,
      name: "Tree House",
      availability: 3,
      rate_plans: [
        {
          rate_plan_id: 11976,
          name: "Best Available Rate",
          penalty: { name: "48 hour cancellation", rules: [] },
          secondary_rate_plan_id: null,
          secondary_season_id: null,
          secondary_period_start: null,
          combined_plan: false,
          occupancies: [
            {
              id: "103939__11976__2__1",
              adults: "2",
              children: "1",
              total_price: "640",
              total_taxes_and_fees: "50",
              prices: [
                { date: "2026-10-10", total_price: "320" },
                { date: "2026-10-11", total_price: "320" },
              ],
              addons: [],
            },
          ],
        },
      ],
    },
  ],
};

test("builds one complete documented line item per requested room", () => {
  const result = prepareBookingCore(request, availability, 7849);

  assert.equal(result.payload.lineItems.length, 2);
  assert.equal(result.payload.checkIn, request.checkIn);
  assert.equal(result.payload.quoteInfo.checkInDate, request.checkIn);
  assert.deepEqual(result.payload.quoteInfo, {
    checkInDate: request.checkIn,
    checkOutDate: request.checkOut,
    customerDetail: request.customerDetail,
    guestDetail: null,
    guestCategory: "INDIVIDUAL",
    city: "",
    state: "",
    country: "",
    gstNumber: "",
    discount: null,
  });
  assert.equal(result.payload.propertyId, 7849);
  assert.equal(result.summary.checkIn, request.checkIn);
  assert.equal(result.summary.checkOut, request.checkOut);
  assert.equal(result.summary.totalAmount, 1380);
  assert.deepEqual(result.summary.childAge, [7]);
  assert.deepEqual(result.summary.customerDetail, request.customerDetail);
  assert.deepEqual(result.payload.lineItems[0], {
    room: {
      room_type: 103939,
      adults: 2,
      children: 1,
      childAge: [7],
      rate_plan: {
        rate_plan_id: 11976,
        name: "Best Available Rate",
        total_price: "640",
        total_taxes_and_fees: "50",
        penalty: { name: "48 hour cancellation", rules: [] },
        prices: [
          { date: "2026-10-10", total_price: "320" },
          { date: "2026-10-11", total_price: "320" },
        ],
        addons: [],
        secondary_rate_plan_id: null,
        secondary_season_id: null,
        secondary_period_start: null,
        combined_plan: false,
      },
    },
  });
  assert.notEqual(
    result.payload.lineItems[0]?.room.rate_plan,
    result.payload.lineItems[1]?.room.rate_plan
  );
  assert.equal(result.summary.roomPrice, 1280);
  assert.equal(result.summary.taxesAndFees, 100);
});

test("full-online payload uses the complete validated total and 100 percent", () => {
  const core = prepareBookingCore(request, availability, 7849).payload;
  const booking = buildSimplotelBookingPayload(core);
  assert.equal(booking.advanceAmount, 0);
  assert.deepEqual(booking.holdInventory, {
    enabled: true,
    value: 24,
    unit: "HOURS",
  });

  const payNow = buildFullOnlineInvoicePayload(core, getInvoiceInventoryHold("30", "MINUTES"));
  assert.equal(payNow.advanceAmount, 1380);
  assert.equal(payNow.advancePercentage, 100);
  assert.deepEqual(payNow.holdInventory, { enabled: true, value: 30, unit: "MINUTES" });
  assert.deepEqual(payNow.lineItems, core.lineItems);
  assert.deepEqual(payNow.quoteInfo, core.quoteInfo);
});

test("invoice hold supports positive whole values in exactly the confirmed units", () => {
  for (const unit of ["MINUTES", "HOURS", "DAYS"]) {
    assert.deepEqual(getInvoiceInventoryHold("1", unit), { enabled: true, value: 1, unit });
  }
});

test("invoice hold rejects invalid values and units without property-default fallback", () => {
  for (const value of ["", "0", "-1", "0.5", "1.5", " 2", "2 ", "abc", "Infinity", "9007199254740992", "1e2", "+1"]) {
    assert.throws(() => getInvoiceInventoryHold(value, "MINUTES"), InvoiceConfigurationError);
  }
  for (const unit of ["", "minutes", "HOUR", "SECONDS", " HOURS", "HOURS "]) {
    assert.throws(() => getInvoiceInventoryHold("30", unit), InvoiceConfigurationError);
  }
});

test("invoice builder reads hold from the server environment only", () => {
  const keys = ["SIMPLOTEL_INVOICE_HOLD_VALUE", "SIMPLOTEL_INVOICE_HOLD_UNIT", "SIMPLOTEL_INVOICE_HOLD_HOURS"] as const;
  const previous = keys.map((key) => process.env[key]);
  try {
    delete process.env.SIMPLOTEL_INVOICE_HOLD_VALUE;
    delete process.env.SIMPLOTEL_INVOICE_HOLD_UNIT;
    process.env.SIMPLOTEL_INVOICE_HOLD_HOURS = "1"; // Legacy configuration cannot be a fallback.
    const core = prepareBookingCore(request, availability, 7849).payload;
    assert.throws(() => buildFullOnlineInvoicePayload(core), InvoiceConfigurationError);
    process.env.SIMPLOTEL_INVOICE_HOLD_VALUE = "30";
    assert.throws(() => buildFullOnlineInvoicePayload(core), InvoiceConfigurationError);
    delete process.env.SIMPLOTEL_INVOICE_HOLD_VALUE;
    process.env.SIMPLOTEL_INVOICE_HOLD_UNIT = "MINUTES";
    assert.throws(() => buildFullOnlineInvoicePayload(core), InvoiceConfigurationError);
    process.env.SIMPLOTEL_INVOICE_HOLD_VALUE = "30";
    const withUntrustedHold = { ...core, holdInventory: { enabled: false, value: 999, unit: "DAYS" } };
    assert.deepEqual(buildFullOnlineInvoicePayload(withUntrustedHold).holdInventory, {
      enabled: true, value: 30, unit: "MINUTES",
    });
  } finally {
    keys.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    });
  }
});

test("preserves the proven total_room_price availability variant", () => {
  const variant = structuredClone(availability);
  const occupancy = variant.rooms?.[0]?.rate_plans[0]?.occupancies[0];
  assert.ok(occupancy);
  delete occupancy.total_price;
  occupancy.total_room_price = "725";
  const selectedOccupancy = structuredClone(request.selection.occupancy);
  delete selectedOccupancy.total_price;
  selectedOccupancy.total_room_price = "725";

  const result = prepareBookingCore(
    {
      ...request,
      selection: {
        ...request.selection,
        totalPrice: "725",
        totalAmount: 1550,
        occupancy: selectedOccupancy,
      },
    },
    variant,
    7849
  );
  assert.equal(
    result.payload.lineItems[0]?.room.rate_plan.total_price,
    "725"
  );
});

test("validates child ages and self-booking guest details", () => {
  assert.throws(
    () =>
      validateBookingPreparationRequest({
        ...request,
        childAge: [],
      }),
    (error: unknown) =>
      error instanceof BookingPreparationError &&
      error.code === "INVALID_REQUEST"
  );
});

test("rejects unavailable quantities before preparing data", () => {
  const unavailable = structuredClone(availability);
  if (unavailable.rooms?.[0]) unavailable.rooms[0].availability = 1;

  assert.throws(
    () => prepareBookingCore(request, unavailable, 7849),
    (error: unknown) =>
      error instanceof BookingPreparationError &&
      error.code === "NO_LONGER_AVAILABLE"
  );
});

test("rejects changed rate or occupancy selections", () => {
  assert.throws(
    () =>
      prepareBookingCore(
        {
          ...request,
          selection: { ...request.selection, ratePlanId: 99999 },
        },
        availability,
        7849
      ),
    (error: unknown) =>
      error instanceof BookingPreparationError &&
      error.code === "SELECTION_CHANGED"
  );
});

test("rejects a price or tax change during revalidation", () => {
  const changed = structuredClone(availability);
  const occupancy = changed.rooms?.[0]?.rate_plans[0]?.occupancies[0];
  assert.ok(occupancy);
  occupancy.total_price = "700";

  assert.throws(
    () => prepareBookingCore(request, changed, 7849),
    (error: unknown) =>
      error instanceof BookingPreparationError &&
      error.code === "SELECTION_CHANGED"
  );
});

test("rejects a reviewed total that differs from the fresh complete total", () => {
  assert.throws(
    () =>
      prepareBookingCore(
        {
          ...request,
          selection: { ...request.selection, totalAmount: 1379 },
        },
        availability,
        7849
      ),
    (error: unknown) =>
      error instanceof BookingPreparationError &&
      error.code === "SELECTION_CHANGED"
  );
});

test("rejects a changed daily price even when the total is unchanged", () => {
  const changed = structuredClone(availability);
  const occupancy = changed.rooms?.[0]?.rate_plans[0]?.occupancies[0];
  assert.ok(occupancy);
  occupancy.prices = [
    { date: "2026-10-10", total_price: "300" },
    { date: "2026-10-11", total_price: "340" },
  ];

  assert.throws(
    () => prepareBookingCore(request, changed, 7849),
    (error: unknown) =>
      error instanceof BookingPreparationError &&
      error.code === "SELECTION_CHANGED"
  );
});
