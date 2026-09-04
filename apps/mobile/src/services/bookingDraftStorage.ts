import * as SecureStore from "expo-secure-store";
import type { AvailabilityRequest, BookingGuestDetails } from "./simplotel";

const KEY = "holistic.booking.draft.v1";

export type SafeBookingDraft = {
  status: "in_progress" | "uncertain";
  request: AvailabilityRequest;
  guest: BookingGuestDetails;
};

function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseSafeBookingDraft(value: string | null): SafeBookingDraft | null {
  if (!value || value.length > 4096) return null;
  try {
    const draft = JSON.parse(value) as Partial<SafeBookingDraft>;
    const request = draft.request;
    const guest = draft.guest;
    if (
      (draft.status !== "in_progress" && draft.status !== "uncertain") ||
      !request || !validDate(request.checkIn) || !validDate(request.checkOut) ||
      !Number.isInteger(request.adults) || request.adults < 1 || request.adults > 4 ||
      !Number.isInteger(request.children) || request.children < 0 || request.children > 4 ||
      !Number.isInteger(request.rooms) || request.rooms < 1 || request.rooms > 20 ||
      !Array.isArray(request.childAge) || !request.childAge.every(age => Number.isInteger(age) && age >= 0 && age <= 17) ||
      !guest || typeof guest.name !== "string" || guest.name.length > 120 ||
      typeof guest.email !== "string" || guest.email.length > 254 ||
      typeof guest.phone !== "string" || guest.phone.length > 32
    ) return null;
    return { status: draft.status, request, guest };
  } catch {
    return null;
  }
}

export async function loadBookingDraft() {
  return parseSafeBookingDraft(await SecureStore.getItemAsync(KEY));
}

export async function saveBookingDraft(draft: SafeBookingDraft) {
  await SecureStore.setItemAsync(KEY, JSON.stringify(draft), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearBookingDraft() {
  await SecureStore.deleteItemAsync(KEY);
}
