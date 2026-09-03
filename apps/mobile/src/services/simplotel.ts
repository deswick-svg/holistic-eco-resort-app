import { getRoomMedia } from "../data/roomMedia";
import "./cognitoAuth";
import { fetchAuthSession } from "aws-amplify/auth";

const SIMPLOTEL_API_BASE_URL = "http://192.168.1.100:3000";

export type AvailabilityRequest = {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childAge: number[];
  rooms: number;
};

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type BookingRateSelection = {
  roomTypeId: number;
  ratePlanId: number;
  occupancyId: string;
  adults: number;
  children: number;
  totalPrice: string;
  totalTaxesAndFees: string;
  ratePlan: {
    rate_plan_id: number;
    name: string;
    penalty: JsonValue;
    secondary_rate_plan_id?: JsonValue;
    secondary_season_id?: JsonValue;
    secondary_period_start?: JsonValue;
    combined_plan?: boolean;
  };
  occupancy: {
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
};

export type LiveStayRate = {
  stayId: string;
  roomName: string;
  availableUnits: number;
  totalAmount: number;
  currency: "INR";
  ratePlanName?: string;
  imageUrl?: string;
  imageGallery?: string[];
  bookingSelection: BookingRateSelection;
};

export type BookingGuestDetails = {
  name: string;
  email: string;
  phone: string;
};

export type BookingPreparationResponse = {
  status: "PREPARED_NOT_BOOKED";
  paymentCreationEnabled: boolean;
  summary: {
    checkIn: string;
    checkOut: string;
    roomTypeId: number;
    roomName: string;
    ratePlanId: number;
    ratePlanName: string;
    occupancyId: string;
    rooms: number;
    adultsPerRoom: number;
    childrenPerRoom: number;
    childAge: number[];
    roomPrice: number;
    taxesAndFees: number;
    totalAmount: number;
    currency: "INR";
    penalty: JsonValue;
    customerDetail: BookingGuestDetails & { bookingForSelf: true };
  };
  preservedBookingData: {
    lineItemCount: number;
    hasDailyPrices: boolean;
    hasPenalty: boolean;
  };
  paymentBehavior: {
    method: "PAY_FULL_ONLINE";
    advanceAmount: number;
    advancePercentage: 100;
    paymentStatus: "NOT_STARTED";
  };
};

export type PaymentLinkResponse = {
  status: "PAYMENT_LINK_CREATED";
  booking_id: string;
  quote_id: string;
  invoice_id: number;
  paymentStatus: "PAYMENT_PENDING";
  bookingStatus: "UNCONFIRMED";
};

function bookingRequestBody(input: {
  request: AvailabilityRequest;
  selectedRate: LiveStayRate;
  guest: BookingGuestDetails;
}) {
  return {
    ...input.request,
    selection: {
      roomTypeId: input.selectedRate.bookingSelection.roomTypeId,
      ratePlanId: input.selectedRate.bookingSelection.ratePlanId,
      occupancyId: input.selectedRate.bookingSelection.occupancyId,
      totalPrice: input.selectedRate.bookingSelection.totalPrice,
      totalTaxesAndFees:
        input.selectedRate.bookingSelection.totalTaxesAndFees,
      totalAmount: input.selectedRate.totalAmount * input.request.rooms,
      ratePlan: input.selectedRate.bookingSelection.ratePlan,
      occupancy: input.selectedRate.bookingSelection.occupancy,
    },
    customerDetail: { ...input.guest, bookingForSelf: true },
  };
}

type RemoteRoomMedia = {
  primaryImage: string;
  gallery: string[];
};

type RoomMediaResponse = {
  rooms?: Record<string, RemoteRoomMedia>;
};

async function getRemoteRoomMedia(): Promise<Record<string, RemoteRoomMedia>> {
  try {
    const response = await fetch(
      `${SIMPLOTEL_API_BASE_URL}/api/simplotel/room-media`
    );

    if (!response.ok) return {};

    const data = (await response.json()) as RoomMediaResponse;
    return data.rooms ?? {};
  } catch (error) {
    console.warn("Unable to load room media; live rates will continue without it.", error);
    return {};
  }
}

/**
 * Simplotel adapter boundary.
 *
 * Production implementation must be based on the official integration/API
 * documentation for the resort's Simplotel account. Until then we keep the
 * booking system authoritative and avoid inventing a parallel inventory.
 */
export const simplotel = {
  async getAvailability(
  request: AvailabilityRequest
): Promise<LiveStayRate[]> {
  const [response, remoteRoomMedia] = await Promise.all([
    fetch(`${SIMPLOTEL_API_BASE_URL}/api/simplotel/availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }),
    getRemoteRoomMedia(),
  ]);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Simplotel availability failed: ${response.status} ${errorText}`
    );
  }

  const data = await response.json();

  if (!Array.isArray(data.rooms)) {
    return [];
  }

  return data.rooms.flatMap((room: any) => {
    const roomTypeId = String(room.room_type);
    const media = remoteRoomMedia[roomTypeId] ?? getRoomMedia(roomTypeId);

    return (room.rate_plans ?? []).flatMap((ratePlan: any) =>
      (ratePlan.occupancies ?? [])
        .filter(
          (occupancy: any) =>
            Number(occupancy.adults) === request.adults &&
            Number(occupancy.children) === request.children
        )
        .map((occupancy: any) => {
        const roomPrice = Number(
          occupancy.total_price ?? occupancy.total_room_price ?? 0
        );
        const taxes = Number(occupancy.total_taxes_and_fees ?? 0);
        const occupancyId = String(occupancy.id ?? "");
        const ratePlanId = Number(ratePlan.rate_plan_id);

        return {
          stayId: `${roomTypeId}:${ratePlanId}:${occupancyId}`,
          roomName: String(room.name ?? "Room"),
          availableUnits: Number(room.availability ?? 0),
          totalAmount: roomPrice + taxes,
          currency: "INR" as const,
          ratePlanName: String(ratePlan.name ?? "Rate plan"),
          imageUrl: media?.primaryImage,
          imageGallery: media?.gallery,
          bookingSelection: {
            roomTypeId: Number(room.room_type),
            ratePlanId,
            occupancyId,
            adults: Number(occupancy.adults),
            children: Number(occupancy.children),
            totalPrice: String(
              occupancy.total_price ?? occupancy.total_room_price ?? "0"
            ),
            totalTaxesAndFees: String(
              occupancy.total_taxes_and_fees ?? "0"
            ),
            ratePlan: {
              rate_plan_id: ratePlanId,
              name: String(ratePlan.name ?? ""),
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
                ? { combined_plan: Boolean(ratePlan.combined_plan) }
                : {}),
            },
            occupancy: {
              id: occupancyId,
              adults: String(occupancy.adults ?? ""),
              children: String(occupancy.children ?? ""),
              ...(occupancy.average_price !== undefined
                ? { average_price: String(occupancy.average_price) }
                : {}),
              ...(occupancy.total_price !== undefined
                ? { total_price: String(occupancy.total_price) }
                : {}),
              ...(occupancy.total_room_price !== undefined
                ? { total_room_price: String(occupancy.total_room_price) }
                : {}),
              total_taxes_and_fees: String(
                occupancy.total_taxes_and_fees ?? "0"
              ),
              prices: occupancy.prices ?? [],
              addons: occupancy.addons ?? [],
            },
          },
        };
        })
    );
  });
},

  async prepareBooking(input: {
    request: AvailabilityRequest;
    selectedRate: LiveStayRate;
    guest: BookingGuestDetails;
  }): Promise<BookingPreparationResponse> {
    const response = await fetch(
      `${SIMPLOTEL_API_BASE_URL}/api/simplotel/booking/prepare`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingRequestBody(input)),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data?.error?.message ?? "Booking details could not be prepared."
      );
    }
    return data as BookingPreparationResponse;
  },

  async createFullOnlinePayment(input: {
    request: AvailabilityRequest;
    selectedRate: LiveStayRate;
    guest: BookingGuestDetails;
    submissionId: string;
  }): Promise<PaymentLinkResponse> {
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken;
    if (!accessToken) throw new Error("Please sign in before creating a payment link.");
    const response = await fetch(
      `${SIMPLOTEL_API_BASE_URL}/api/simplotel/booking/send-invoice`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken.toString()}` },
        body: JSON.stringify({
          ...bookingRequestBody(input),
          submissionId: input.submissionId,
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message ?? "Payment link could not be created.");
    }
    if (!data?.booking_id || !data?.quote_id || !Number.isInteger(data?.invoice_id) ||
        data?.status !== "PAYMENT_LINK_CREATED" ||
        data?.bookingStatus !== "UNCONFIRMED" ||
        data?.paymentStatus !== "PAYMENT_PENDING") {
      throw new Error("Invoice response did not contain the required identifiers.");
    }
    return data as PaymentLinkResponse;
  },

  async manageBooking(_bookingId: string): Promise<unknown> {
    throw new Error('Simplotel manage-booking API not connected yet.');
  }
};
