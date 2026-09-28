const DEFAULT_SIMPLOTEL_API_ORIGIN = "https://admin.simplotel.com";

/** Server-only Simplotel host. Empty config keeps the current admin API. */
export function readSimplotelApiOrigin(value = process.env.SIMPLOTEL_API_BASE_URL): string {
  const raw = (value === undefined || value.trim() === "" ? DEFAULT_SIMPLOTEL_API_ORIGIN : value.trim()).replace(/\/+$/, "");
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Simplotel API base URL is invalid");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error("Simplotel API base URL is invalid");
  }
  return url.origin;
}

export function simplotelVoiceBotUrl(
  hotelId: number,
  endpoint: "availability" | "book" | "send-invoice",
  origin = readSimplotelApiOrigin(),
): string {
  return `${origin}/api/v1/hotel/${hotelId}/voice-bot/${endpoint}`;
}

/** Server-only property id. Empty config keeps Holistic Eco-Resort, Kannur. */
export function readSimplotelHotelId(value = process.env.SIMPLOTEL_HOTEL_ID): number {
  const raw = value === undefined || value.trim() === "" ? "7849" : value.trim();
  if (!/^[1-9]\d{0,8}$/.test(raw)) {
    throw new Error("Simplotel hotel id is invalid");
  }
  return Number(raw);
}
