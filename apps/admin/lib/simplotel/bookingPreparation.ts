export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SimplotelOccupancy = {
  id: string;
  adults: string;
  children: string;
  average_price?: string;
  total_price?: string;
  total_room_price?: string;
  total_taxes_and_fees: string;
  prices: JsonValue[];
  addons: JsonValue[];
};

export type SimplotelRatePlan = {
  rate_plan_id: number;
  name: string;
  penalty: JsonValue;
  occupancies: SimplotelOccupancy[];
  secondary_rate_plan_id?: JsonValue;
  secondary_season_id?: JsonValue;
  secondary_period_start?: JsonValue;
  combined_plan?: boolean;
};

export type SimplotelAvailabilityRoom = {
  room_type: number;
  name: string;
  availability: number;
  rate_plans: SimplotelRatePlan[];
};

export type SimplotelAvailabilityResponse = {
  rooms?: SimplotelAvailabilityRoom[];
};

export type BookingPreparationRequest = {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childAge: number[];
  rooms: number;
  selection: {
    roomTypeId: number;
    ratePlanId: number;
    occupancyId: string;
    totalPrice: string;
    totalTaxesAndFees: string;
    ratePlan: Omit<SimplotelRatePlan, "occupancies">;
    occupancy: SimplotelOccupancy;
  };
  customerDetail: {
    name: string;
    email: string;
    phone: string;
    bookingForSelf: true;
  };
};

export type PreparedLineItem = {
  room: {
    room_type: number;
    adults: number;
    children: number;
    childAge?: number[];
    rate_plan: {
      rate_plan_id: number;
      name: string;
      total_price: string;
      total_taxes_and_fees: string;
      penalty: JsonValue;
      prices: JsonValue[];
      addons: JsonValue[];
      secondary_rate_plan_id?: JsonValue;
      secondary_season_id?: JsonValue;
      secondary_period_start?: JsonValue;
      combined_plan?: boolean;
    };
  };
};

export type PreparedBookingCore = {
  checkIn: string;
  checkOut: string;
  propertyId: number;
  quoteInfo: {
    checkInDate: string;
    checkOutDate: string;
    customerDetail: BookingPreparationRequest["customerDetail"];
    guestDetail: null;
    guestCategory: "INDIVIDUAL";
    city: "";
    state: "";
    country: "";
    gstNumber: "";
    discount: null;
  };
  lineItems: PreparedLineItem[];
};

export type SimplotelBookingPayload = PreparedBookingCore & {
  advanceAmount: 0;
  holdInventory: {
    enabled: true;
    value: 24;
    unit: "HOURS";
  };
};

export type SimplotelInvoicePayload = PreparedBookingCore & {
  advanceAmount: number;
  advancePercentage: 0 | 100;
  holdInventory: SimplotelBookingPayload["holdInventory"];
};

export class BookingPreparationError extends Error {
  readonly code:
    | "INVALID_REQUEST"
    | "NO_LONGER_AVAILABLE"
    | "SELECTION_CHANGED"
    | "INVALID_AVAILABILITY_RESPONSE";

  constructor(
    message: string,
    code:
      | "INVALID_REQUEST"
      | "NO_LONGER_AVAILABLE"
      | "SELECTION_CHANGED"
      | "INVALID_AVAILABILITY_RESPONSE"
  ) {
    super(message);
    this.code = code;
  }
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function requireInteger(
  value: unknown,
  name: string,
  minimum: number,
  maximum?: number
) {
  if (
    !Number.isInteger(value) ||
    Number(value) < minimum ||
    (maximum !== undefined && Number(value) > maximum)
  ) {
    throw new BookingPreparationError(
      `${name} is invalid.`,
      "INVALID_REQUEST"
    );
  }
  return Number(value);
}

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) return true;
  if (Array.isArray(value)) return value.every(isJsonValue);
  return (
    typeof value === "object" &&
    Object.values(value as Record<string, unknown>).every(isJsonValue)
  );
}

function stableJson(value: JsonValue): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${stableJson(
            (value as Record<string, JsonValue>)[key] as JsonValue
          )}`
      )
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function validateBookingPreparationRequest(
  value: unknown
): BookingPreparationRequest {
  if (!value || typeof value !== "object") {
    throw new BookingPreparationError(
      "Booking preparation request is required.",
      "INVALID_REQUEST"
    );
  }

  const body = value as Record<string, unknown>;
  const checkIn = String(body.checkIn ?? "");
  const checkOut = String(body.checkOut ?? "");
  if (!isIsoDate(checkIn) || !isIsoDate(checkOut) || checkOut <= checkIn) {
    throw new BookingPreparationError(
      "Valid check-in and check-out dates are required.",
      "INVALID_REQUEST"
    );
  }

  const adults = requireInteger(body.adults, "Adults", 1, 4);
  const children = requireInteger(body.children, "Children", 0, 4);
  const rooms = requireInteger(body.rooms, "Rooms", 1);
  const childAge = Array.isArray(body.childAge)
    ? body.childAge.map((age, index) =>
        requireInteger(age, `Child age ${index + 1}`, 0, 17)
      )
    : [];

  if (childAge.length !== children) {
    throw new BookingPreparationError(
      "Provide exactly one age for each child.",
      "INVALID_REQUEST"
    );
  }

  const selection = body.selection as Record<string, unknown> | undefined;
  if (!selection) {
    throw new BookingPreparationError(
      "A room and rate selection is required.",
      "INVALID_REQUEST"
    );
  }

  const roomTypeId = requireInteger(selection.roomTypeId, "Room type", 1);
  const ratePlanId = requireInteger(selection.ratePlanId, "Rate plan", 1);
  const occupancyId = String(selection.occupancyId ?? "").trim();
  const totalPrice = String(selection.totalPrice ?? "").trim();
  const totalTaxesAndFees = String(selection.totalTaxesAndFees ?? "").trim();
  if (
    !occupancyId ||
    !Number.isFinite(Number(totalPrice)) ||
    !Number.isFinite(Number(totalTaxesAndFees))
  ) {
    throw new BookingPreparationError(
      "Complete occupancy and price selection is required.",
      "INVALID_REQUEST"
    );
  }

  const selectedRatePlan = selection.ratePlan;
  const selectedOccupancy = selection.occupancy;
  if (
    !selectedRatePlan ||
    typeof selectedRatePlan !== "object" ||
    !selectedOccupancy ||
    typeof selectedOccupancy !== "object" ||
    !isJsonValue(selectedRatePlan) ||
    !isJsonValue(selectedOccupancy)
  ) {
    throw new BookingPreparationError(
      "The complete selected rate plan and occupancy are required.",
      "INVALID_REQUEST"
    );
  }

  const customer = body.customerDetail as Record<string, unknown> | undefined;
  const name = String(customer?.name ?? "").trim();
  const email = String(customer?.email ?? "").trim();
  const phone = String(customer?.phone ?? "").trim();
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !/^\+\d+$/.test(phone)) {
    throw new BookingPreparationError(
      "Valid guest name, email, and international phone number are required.",
      "INVALID_REQUEST"
    );
  }

  if (customer?.bookingForSelf !== true) {
    throw new BookingPreparationError(
      "Only self-booking is supported until guestDetail is documented.",
      "INVALID_REQUEST"
    );
  }

  return {
    checkIn,
    checkOut,
    adults,
    children,
    childAge,
    rooms,
    selection: {
      roomTypeId,
      ratePlanId,
      occupancyId,
      totalPrice,
      totalTaxesAndFees,
      ratePlan: selectedRatePlan as Omit<SimplotelRatePlan, "occupancies">,
      occupancy: selectedOccupancy as SimplotelOccupancy,
    },
    customerDetail: { name, email, phone, bookingForSelf: true },
  };
}

function requireDocumentedRatePlanData(
  ratePlan: SimplotelRatePlan,
  occupancy: SimplotelOccupancy
) {
  const totalPrice = occupancy.total_price ?? occupancy.total_room_price;
  if (
    typeof totalPrice !== "string" ||
    typeof occupancy.total_taxes_and_fees !== "string" ||
    !Array.isArray(occupancy.prices) ||
    !Array.isArray(occupancy.addons) ||
    ratePlan.penalty === undefined
  ) {
    throw new BookingPreparationError(
      "Availability response is missing documented booking fields.",
      "INVALID_AVAILABILITY_RESPONSE"
    );
  }
  return totalPrice;
}

export function prepareBookingCore(
  request: BookingPreparationRequest,
  availability: SimplotelAvailabilityResponse,
  propertyId: number
) {
  const room = availability.rooms?.find(
    (candidate) => candidate.room_type === request.selection.roomTypeId
  );
  if (!room || room.availability < request.rooms) {
    throw new BookingPreparationError(
      "The selected room is no longer available in the requested quantity.",
      "NO_LONGER_AVAILABLE"
    );
  }

  const ratePlan = room.rate_plans.find(
    (candidate) => candidate.rate_plan_id === request.selection.ratePlanId
  );
  const occupancy = ratePlan?.occupancies.find(
    (candidate) => candidate.id === request.selection.occupancyId
  );
  if (!ratePlan || !occupancy) {
    throw new BookingPreparationError(
      "The selected room, rate plan, or occupancy has changed.",
      "SELECTION_CHANGED"
    );
  }

  if (
    Number(occupancy.adults) !== request.adults ||
    Number(occupancy.children) !== request.children
  ) {
    throw new BookingPreparationError(
      "The selected occupancy no longer matches the requested guests.",
      "SELECTION_CHANGED"
    );
  }

  const totalPrice = requireDocumentedRatePlanData(ratePlan, occupancy);
  if (
    Number(totalPrice) !== Number(request.selection.totalPrice) ||
    Number(occupancy.total_taxes_and_fees) !==
      Number(request.selection.totalTaxesAndFees)
  ) {
    throw new BookingPreparationError(
      "The selected price or taxes changed. Review live availability again.",
      "SELECTION_CHANGED"
    );
  }

  const selectedRatePlanSnapshot: JsonValue = request.selection.ratePlan;
  const freshRatePlanSnapshot: JsonValue = {
    rate_plan_id: ratePlan.rate_plan_id,
    name: ratePlan.name,
    penalty: ratePlan.penalty,
    ...(ratePlan.secondary_rate_plan_id !== undefined
      ? { secondary_rate_plan_id: ratePlan.secondary_rate_plan_id }
      : {}),
    ...(ratePlan.secondary_season_id !== undefined
      ? { secondary_season_id: ratePlan.secondary_season_id }
      : {}),
    ...(ratePlan.secondary_period_start !== undefined
      ? { secondary_period_start: ratePlan.secondary_period_start }
      : {}),
    ...(ratePlan.combined_plan !== undefined
      ? { combined_plan: ratePlan.combined_plan }
      : {}),
  };
  const selectedOccupancySnapshot: JsonValue = request.selection.occupancy;
  const freshOccupancySnapshot: JsonValue = {
    id: occupancy.id,
    adults: occupancy.adults,
    children: occupancy.children,
    ...(occupancy.average_price !== undefined
      ? { average_price: occupancy.average_price }
      : {}),
    ...(occupancy.total_price !== undefined
      ? { total_price: occupancy.total_price }
      : {}),
    ...(occupancy.total_room_price !== undefined
      ? { total_room_price: occupancy.total_room_price }
      : {}),
    total_taxes_and_fees: occupancy.total_taxes_and_fees,
    prices: occupancy.prices,
    addons: occupancy.addons,
  };
  if (
    stableJson(selectedRatePlanSnapshot) !== stableJson(freshRatePlanSnapshot) ||
    stableJson(selectedOccupancySnapshot) !== stableJson(freshOccupancySnapshot)
  ) {
    throw new BookingPreparationError(
      "The selected rate plan, daily prices, taxes, or occupancy changed. Review live availability again.",
      "SELECTION_CHANGED"
    );
  }
  const ratePlanForBooking: PreparedLineItem["room"]["rate_plan"] = {
    rate_plan_id: ratePlan.rate_plan_id,
    name: ratePlan.name,
    total_price: totalPrice,
    total_taxes_and_fees: occupancy.total_taxes_and_fees,
    penalty: ratePlan.penalty,
    prices: occupancy.prices,
    addons: occupancy.addons,
  };

  for (const field of [
    "secondary_rate_plan_id",
    "secondary_season_id",
    "secondary_period_start",
    "combined_plan",
  ] as const) {
    if (ratePlan[field] !== undefined) {
      Object.assign(ratePlanForBooking, { [field]: ratePlan[field] });
    }
  }

  const lineItems = Array.from({ length: request.rooms }, () => ({
    room: {
      room_type: room.room_type,
      adults: request.adults,
      children: request.children,
      ...(request.children > 0 ? { childAge: [...request.childAge] } : {}),
      rate_plan: structuredClone(ratePlanForBooking),
    },
  }));

  const payload: PreparedBookingCore = {
    checkIn: request.checkIn,
    checkOut: request.checkOut,
    propertyId,
    quoteInfo: {
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
    },
    lineItems,
  };

  return {
    payload,
    summary: {
      checkIn: request.checkIn,
      checkOut: request.checkOut,
      roomTypeId: room.room_type,
      roomName: room.name,
      ratePlanId: ratePlan.rate_plan_id,
      ratePlanName: ratePlan.name,
      occupancyId: occupancy.id,
      rooms: request.rooms,
      adultsPerRoom: request.adults,
      childrenPerRoom: request.children,
      childAge: [...request.childAge],
      roomPrice: Number(totalPrice) * request.rooms,
      taxesAndFees: Number(occupancy.total_taxes_and_fees) * request.rooms,
      totalAmount:
        (Number(totalPrice) + Number(occupancy.total_taxes_and_fees)) *
        request.rooms,
      currency: "INR" as const,
      penalty: ratePlan.penalty,
      customerDetail: { ...request.customerDetail },
    },
  };
}

export function buildSimplotelBookingPayload(
  core: PreparedBookingCore
): SimplotelBookingPayload {
  return {
    ...structuredClone(core),
    advanceAmount: 0,
    holdInventory: { enabled: true, value: 24, unit: "HOURS" },
  };
}

export function buildSimplotelInvoicePayload(
  core: PreparedBookingCore,
  advanceAmount: number,
  advancePercentage: 0 | 100
): SimplotelInvoicePayload {
  if (
    !Number.isFinite(advanceAmount) ||
    advanceAmount < 0 ||
    (advanceAmount === 0 && advancePercentage !== 0) ||
    (advanceAmount > 0 && advancePercentage !== 100)
  ) {
    throw new BookingPreparationError(
      "Invoice payment values must match a documented Simplotel flow.",
      "INVALID_REQUEST"
    );
  }

  return {
    ...structuredClone(core),
    advanceAmount,
    advancePercentage,
    holdInventory: { enabled: true, value: 24, unit: "HOURS" },
  };
}
