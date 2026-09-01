import { NextResponse } from "next/server";
import {
  BookingPreparationError,
  buildFullOnlineInvoicePayload,
  prepareBookingCore,
  validateBookingPreparationRequest,
  type SimplotelAvailabilityResponse,
} from "../../../../../lib/simplotel/bookingPreparation";
import {
  BookingExecutionError,
  bookingSubmissionRegistry,
  isFullOnlinePaymentEnabled,
  postToSimplotel,
  requireBookingCreationEnabled,
} from "../../../../../lib/simplotel/bookingExecution";

const SIMPLOTEL_HOTEL_ID = 7849;

export async function POST(request: Request) {
  try {
    requireBookingCreationEnabled(isFullOnlinePaymentEnabled());

    const accessToken = process.env.SIMPLOTEL_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: { code: "SERVER_CONFIGURATION", message: "Invoice creation is unavailable." } },
        { status: 500 }
      );
    }

    const rawBody = (await request.json()) as Record<string, unknown>;
    const submissionId = String(rawBody.submissionId ?? "");
    const bookingRequest = validateBookingPreparationRequest(rawBody);

    const confirmation = await bookingSubmissionRegistry.run(
      `payment_${submissionId}`,
      async () => {
        const rooms = Array.from({ length: bookingRequest.rooms }, (_, index) => ({
          id: index + 1,
          adults: bookingRequest.adults,
          children: bookingRequest.children,
          ...(bookingRequest.children > 0 ? { childAge: bookingRequest.childAge } : {}),
        }));
        const availabilityResponse = await fetch(
          `https://admin.simplotel.com/api/v1/hotel/${SIMPLOTEL_HOTEL_ID}/voice-bot/availability`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              checkIn: bookingRequest.checkIn,
              checkOut: bookingRequest.checkOut,
              rooms,
              propertyId: SIMPLOTEL_HOTEL_ID,
            }),
            cache: "no-store",
          }
        );
        if (!availabilityResponse.ok) {
          throw new BookingExecutionError(
            "Live availability could not be revalidated. No invoice request was sent.",
            "NO_LONGER_AVAILABLE",
            409
          );
        }
        const availability = (await availabilityResponse.json()) as SimplotelAvailabilityResponse;
        const prepared = prepareBookingCore(
          bookingRequest,
          availability,
          SIMPLOTEL_HOTEL_ID
        );

        return postToSimplotel({
          endpoint: "send-invoice",
          hotelId: SIMPLOTEL_HOTEL_ID,
          accessToken,
          payload: buildFullOnlineInvoicePayload(prepared.payload),
        });
      }
    );

    return NextResponse.json({
      status: "PAYMENT_LINK_CREATED",
      ...confirmation,
      paymentStatus: "PAYMENT_PENDING",
    });
  } catch (error) {
    if (error instanceof BookingPreparationError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.code === "INVALID_REQUEST" ? 400 : 409 }
      );
    }
    if (error instanceof BookingExecutionError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    console.error("Simplotel invoice error:", error);
    return NextResponse.json(
      { error: { code: "INVOICE_FAILED", message: "The invoice request could not be completed." } },
      { status: 500 }
    );
  }
}
