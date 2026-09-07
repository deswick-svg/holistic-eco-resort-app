const BOOKING_DETAILS_URL =
  "https://bookings.simplotel.com/payment/get_booking_details";

export type ReconciliationProcessingState =
  | "reconciled_failed"
  | "manual_review";
export type ReconciliationBookingStatus = "failed" | "unknown";
export type ReconciliationPaymentStatus = "not_collected" | "unknown";

export type SimplotelBookingReconciliation = {
  bookingId: string;
  propertyId: number;
  checkIn: string;
  checkOut: string;
  totalAmount: string;
  amountPaid: string;
  refundAmount: string;
  providerBookingStatus: string;
  paymentTransactionId: string | null;
  paymentLinkAvailable: boolean;
  processingState: ReconciliationProcessingState;
  bookingStatus: ReconciliationBookingStatus;
  paymentStatus: ReconciliationPaymentStatus;
};

export class BookingReconciliationError extends Error {
  readonly code: "INVALID_REQUEST" | "PROVIDER_REJECTED" | "UNREADABLE_RESPONSE";

  constructor(code: BookingReconciliationError["code"]) {
    super("Booking reconciliation could not be completed safely");
    this.code = code;
  }
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function decimal(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^\d{1,12}(\.\d{1,4})?$/.test(value)) {
    return undefined;
  }
  return Number.isFinite(Number(value)) ? value : undefined;
}

function isoDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  );
}

/**
 * Projects the provider's large response into reconciliation-only data.
 * Guest details, room content, payment-link keys and arbitrary provider content
 * are deliberately never returned to callers.
 */
export function parseBookingDetailsResponse(
  value: unknown,
  expectedBookingId: string,
): SimplotelBookingReconciliation {
  const envelope = record(value);
  const booking = record(envelope?.booking);
  const payLater = record(booking?.payLaterDetails);
  const bookingId = typeof booking?.bookingId === "string" ? booking.bookingId.trim() : "";
  const propertyId = booking?.propertyId;
  const totalAmount = decimal(booking?.totalAmount);
  const amountPaid = decimal(booking?.amountPaid);
  const refundAmount = decimal(booking?.refundAmount);
  const providerBookingStatus =
    typeof booking?.status === "string" ? booking.status.trim().toUpperCase() : "";

  if (
    !bookingId ||
    bookingId !== expectedBookingId ||
    !Number.isSafeInteger(propertyId) ||
    (propertyId as number) <= 0 ||
    !isoDate(booking?.checkIn) ||
    !isoDate(booking?.checkOut) ||
    booking.checkOut <= booking.checkIn ||
    !totalAmount ||
    !amountPaid ||
    !refundAmount ||
    !providerBookingStatus
  ) {
    throw new BookingReconciliationError("UNREADABLE_RESPONSE");
  }

  const transactionId =
    typeof booking.pgTransactionID === "string" && booking.pgTransactionID.trim()
      ? booking.pgTransactionID.trim()
      : null;
  const payLinkKey =
    typeof payLater?.payLinkKey === "string" ? payLater.payLinkKey.trim() : "";
  const failedWithoutPayment =
    providerBookingStatus === "FAILED" && Number(amountPaid) === 0 && !transactionId;

  return {
    bookingId,
    propertyId: propertyId as number,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    totalAmount,
    amountPaid,
    refundAmount,
    providerBookingStatus,
    paymentTransactionId: transactionId,
    paymentLinkAvailable: Boolean(payLinkKey),
    processingState: failedWithoutPayment ? "reconciled_failed" : "manual_review",
    bookingStatus: failedWithoutPayment ? "failed" : "unknown",
    paymentStatus: failedWithoutPayment ? "not_collected" : "unknown",
  };
}

export async function getSimplotelBookingDetails(options: {
  bookingId: string;
  accessToken: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}): Promise<SimplotelBookingReconciliation> {
  const bookingId = options.bookingId.trim();
  const accessToken = options.accessToken.trim();
  const timeoutMs = options.timeoutMs ?? 15_000;
  if (
    !/^[A-Za-z0-9_-]{1,128}$/.test(bookingId) ||
    !accessToken ||
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs <= 0
  ) {
    throw new BookingReconciliationError("INVALID_REQUEST");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)(BOOKING_DETAILS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ bookingId }),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch {
    throw new BookingReconciliationError("PROVIDER_REJECTED");
  } finally {
    clearTimeout(timer);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new BookingReconciliationError("UNREADABLE_RESPONSE");
  }
  if (!response.ok) throw new BookingReconciliationError("PROVIDER_REJECTED");
  return parseBookingDetailsResponse(body, bookingId);
}
