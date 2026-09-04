export type BookingFailureKind =
  | "uncertain"
  | "stale"
  | "disabled"
  | "network"
  | "recoverable";

export type BookingFailure = {
  kind: BookingFailureKind;
  message: string;
};

const codeOf = (error: unknown) =>
  error && typeof error === "object" && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";

export function classifyBookingFailure(
  error: unknown,
  phase: "availability" | "prepare" | "invoice"
): BookingFailure {
  const code = codeOf(error);
  if (phase === "invoice" && (code === "OUTCOME_UNCERTAIN" || code === "NETWORK_UNAVAILABLE" || error instanceof TypeError)) {
    return {
      kind: "uncertain",
      message:
        "Do not retry or attempt payment. The resort is checking whether your payment-link request reached the booking provider.",
    };
  }
  if (code === "NO_LONGER_AVAILABLE" || code === "STALE_BOOKING") {
    return {
      kind: "stale",
      message:
        "Availability or pricing changed. Review the latest details and validate the booking again.",
    };
  }
  if (code === "EXECUTION_DISABLED") {
    return {
      kind: "disabled",
      message:
        "Online payment-link creation is currently unavailable. No booking, hold, or payment was created.",
    };
  }
  if (code === "NETWORK_UNAVAILABLE" || error instanceof TypeError) {
    return {
      kind: "network",
      message:
        phase === "availability"
          ? "The resort server could not be reached. Check your connection and try the availability search again."
          : "The resort server could not be reached. No payment request was started; reconnect and validate the booking again.",
    };
  }
  return {
    kind: "recoverable",
    message:
      error instanceof Error && error.message
        ? error.message
        : "The booking request could not be completed.",
  };
}
