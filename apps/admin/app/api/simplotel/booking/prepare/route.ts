import { NextResponse } from "next/server";
import {
  BookingPreparationError,
  prepareBookingCore,
  validateBookingPreparationRequest,
  type SimplotelAvailabilityResponse,
} from "../../../../../lib/simplotel/bookingPreparation";
import { isBookingCreationEnabled } from "../../../../../lib/simplotel/bookingExecution";

const SIMPLOTEL_HOTEL_ID = 7849;
const SIMPLOTEL_ACCESS_TOKEN = process.env.SIMPLOTEL_ACCESS_TOKEN;

export async function POST(request: Request) {
  try {
    if (!SIMPLOTEL_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: { code: "SERVER_CONFIGURATION", message: "Booking preparation is unavailable." } },
        { status: 500 }
      );
    }

    const bookingRequest = validateBookingPreparationRequest(
      await request.json()
    );
    const roomRequests = Array.from(
      { length: bookingRequest.rooms },
      (_, index) => ({
        id: index + 1,
        adults: bookingRequest.adults,
        children: bookingRequest.children,
        ...(bookingRequest.children > 0
          ? { childAge: bookingRequest.childAge }
          : {}),
      })
    );

    const availabilityResponse = await fetch(
      `https://admin.simplotel.com/api/v1/hotel/${SIMPLOTEL_HOTEL_ID}/voice-bot/availability`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SIMPLOTEL_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          checkIn: bookingRequest.checkIn,
          checkOut: bookingRequest.checkOut,
          rooms: roomRequests,
          propertyId: SIMPLOTEL_HOTEL_ID,
        }),
        cache: "no-store",
      }
    );

    const availability = (await availabilityResponse.json()) as
      | SimplotelAvailabilityResponse
      | { error?: { message?: string } };
    if (!availabilityResponse.ok) {
      return NextResponse.json(
        {
          error: {
            code: "REVALIDATION_FAILED",
            message:
              "Live availability could not be revalidated. No booking was created.",
          },
        },
        { status: availabilityResponse.status }
      );
    }

    const prepared = prepareBookingCore(
      bookingRequest,
      availability as SimplotelAvailabilityResponse,
      SIMPLOTEL_HOTEL_ID
    );

    // The prepared payload intentionally remains server-side. This endpoint
    // never calls Simplotel /book and cannot create a reservation.
    return NextResponse.json({
      status: "PREPARED_NOT_BOOKED",
      bookingCreationEnabled: isBookingCreationEnabled(),
      summary: prepared.summary,
      preservedBookingData: {
        lineItemCount: prepared.payload.lineItems.length,
        hasDailyPrices: prepared.payload.lineItems.every(
          (item) => item.room.rate_plan.prices.length > 0
        ),
        hasPenalty: prepared.payload.lineItems.every(
          (item) => item.room.rate_plan.penalty !== undefined
        ),
      },
      bookingBehavior: {
        advanceAmount: 0,
        holdInventory: { enabled: true, value: 24, unit: "HOURS" },
        paymentStatus: "NOT_DETERMINED_BY_BOOK_RESPONSE",
      },
    });
  } catch (error) {
    if (error instanceof BookingPreparationError) {
      const status = error.code === "INVALID_REQUEST" ? 400 : 409;
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status }
      );
    }

    console.error("Simplotel booking preparation error:", error);
    return NextResponse.json(
      {
        error: {
          code: "PREPARATION_FAILED",
          message: "Booking details could not be prepared. No booking was created.",
        },
      },
      { status: 500 }
    );
  }
}
