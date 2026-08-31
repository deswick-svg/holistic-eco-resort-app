import type {
  SimplotelBookingPayload,
  SimplotelInvoicePayload,
} from "./bookingPreparation";

export type SimplotelBookingConfirmation = {
  booking_id: string;
  quote_id: string;
};

export type SimplotelInvoiceConfirmation = SimplotelBookingConfirmation & {
  invoice_id?: number;
};

export class BookingExecutionError extends Error {
  readonly code:
    | "BOOKING_DISABLED"
      | "INVALID_SUBMISSION"
      | "NO_LONGER_AVAILABLE"
      | "SIMPLOTEL_REJECTED"
      | "OUTCOME_UNCERTAIN";
  readonly status: number;

  constructor(
    message: string,
    code:
      | "BOOKING_DISABLED"
      | "INVALID_SUBMISSION"
      | "NO_LONGER_AVAILABLE"
      | "SIMPLOTEL_REJECTED"
      | "OUTCOME_UNCERTAIN",
    status: number
  ) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function isBookingCreationEnabled(value = process.env.SIMPLOTEL_BOOKING_ENABLED) {
  return value === "true";
}

type SubmissionEntry<T> = {
  createdAt: number;
  result: Promise<T>;
  settled: boolean;
};

export class BookingSubmissionRegistry {
  private readonly entries = new Map<string, SubmissionEntry<unknown>>();
  private readonly retentionMs: number;
  private readonly maximumEntries: number;

  constructor(
    retentionMs = 10 * 60 * 1000,
    maximumEntries = 1000
  ) {
    this.retentionMs = retentionMs;
    this.maximumEntries = maximumEntries;
  }

  run<T>(submissionId: string, operation: () => Promise<T>): Promise<T> {
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(submissionId)) {
      throw new BookingExecutionError(
        "A valid booking submission identifier is required.",
        "INVALID_SUBMISSION",
        400
      );
    }

    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (entry.settled && now - entry.createdAt > this.retentionMs) {
        this.entries.delete(key);
      }
    }

    const existing = this.entries.get(submissionId);
    if (existing) return existing.result as Promise<T>;

    if (this.entries.size >= this.maximumEntries) {
      const oldest = [...this.entries].find(([, entry]) => entry.settled)?.[0];
      if (oldest) this.entries.delete(oldest);
    }

    const result = Promise.resolve()
      .then(operation)
      .finally(() => {
        const stored = this.entries.get(submissionId);
        if (stored?.result === result) stored.settled = true;
      });
    const entry: SubmissionEntry<T> = { createdAt: now, result, settled: false };
    this.entries.set(submissionId, entry as SubmissionEntry<unknown>);
    return result;
  }
}

export const bookingSubmissionRegistry = new BookingSubmissionRegistry();

type SimplotelEndpoint = "book" | "send-invoice";

type SimplotelRequest = {
  endpoint: SimplotelEndpoint;
  hotelId: number;
  accessToken: string;
  payload: SimplotelBookingPayload | SimplotelInvoicePayload;
  fetcher?: typeof fetch;
};

function parseConfirmation(
  endpoint: SimplotelEndpoint,
  value: unknown,
  invoiceIdRequired: boolean
): SimplotelBookingConfirmation | SimplotelInvoiceConfirmation {
  if (!value || typeof value !== "object") {
    throw new BookingExecutionError(
      "Simplotel returned an invalid booking response. The outcome is uncertain; do not retry automatically.",
      "OUTCOME_UNCERTAIN",
      502
    );
  }

  const response = value as Record<string, unknown>;
  const bookingId = String(response.booking_id ?? "").trim();
  const quoteId = String(response.quote_id ?? "").trim();
  if (!bookingId || !quoteId) {
    throw new BookingExecutionError(
      "Simplotel did not return the required booking identifiers. The outcome is uncertain; do not retry automatically.",
      "OUTCOME_UNCERTAIN",
      502
    );
  }

  if (endpoint === "send-invoice" && response.invoice_id !== undefined) {
    if (!Number.isInteger(response.invoice_id)) {
      throw new BookingExecutionError(
        "Simplotel returned an invalid invoice identifier. The outcome is uncertain; do not retry automatically.",
        "OUTCOME_UNCERTAIN",
        502
      );
    }
    return {
      booking_id: bookingId,
      quote_id: quoteId,
      invoice_id: Number(response.invoice_id),
    };
  }

  if (invoiceIdRequired) {
    throw new BookingExecutionError(
      "Simplotel did not return the documented invoice identifier. The outcome is uncertain; do not retry automatically.",
      "OUTCOME_UNCERTAIN",
      502
    );
  }

  return { booking_id: bookingId, quote_id: quoteId };
}

export async function postToSimplotel({
  endpoint,
  hotelId,
  accessToken,
  payload,
  fetcher = fetch,
}: SimplotelRequest) {
  let response: Response;
  try {
    response = await fetcher(
      `https://admin.simplotel.com/api/v1/hotel/${hotelId}/voice-bot/${endpoint}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );
  } catch {
    throw new BookingExecutionError(
      "The booking request outcome is uncertain. Do not retry automatically; contact the resort before trying again.",
      "OUTCOME_UNCERTAIN",
      502
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new BookingExecutionError(
      "Simplotel returned an unreadable response. The outcome is uncertain; do not retry automatically.",
      "OUTCOME_UNCERTAIN",
      502
    );
  }

  if (!response.ok) {
    const message =
      typeof (body as { error?: { message?: unknown } })?.error?.message ===
      "string"
        ? String((body as { error: { message: string } }).error.message)
        : "Simplotel rejected the booking request.";
    const soldOut = /no rooms available|inventory|sold out/i.test(message);
    throw new BookingExecutionError(
      soldOut
        ? "The selected room is no longer available. Review live availability again."
        : message,
      soldOut ? "NO_LONGER_AVAILABLE" : "SIMPLOTEL_REJECTED",
      soldOut ? 409 : 502
    );
  }

  return parseConfirmation(
    endpoint,
    body,
    endpoint === "send-invoice" && payload.advanceAmount > 0
  );
}

export function requireBookingCreationEnabled(enabled: boolean) {
  if (!enabled) {
    throw new BookingExecutionError(
      "Booking creation is not enabled.",
      "BOOKING_DISABLED",
      403
    );
  }
}
