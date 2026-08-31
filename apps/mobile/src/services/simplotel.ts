import { getRoomMedia } from "../data/roomMedia";

const SIMPLOTEL_API_BASE_URL = "http://192.168.1.100:3000";

export type AvailabilityRequest = {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
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
};

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

  return data.rooms.map((room: any) => {
    const roomTypeId = String(room.room_type);
    const media = remoteRoomMedia[roomTypeId] ?? getRoomMedia(roomTypeId);
    const ratePlan = room.rate_plans?.[0];
    const occupancy = ratePlan?.occupancies?.[0];

    const roomPrice = Number(occupancy?.total_room_price ?? 0);
    const taxes = Number(occupancy?.total_taxes_and_fees ?? 0);

    return {
      stayId: roomTypeId,
      roomName: String(room.name ?? "Room"),
      availableUnits: Number(room.availability ?? 0),
      totalAmount: roomPrice + taxes,
      currency: "INR" as const,
      ratePlanName: ratePlan?.name,
      imageUrl: media?.primaryImage,
      imageGallery: media?.gallery,
    };
  });
},

  async createBooking(_payload: unknown): Promise<{ bookingId: string }> {
    throw new Error('Simplotel booking creation not connected yet.');
  },

  async manageBooking(_bookingId: string): Promise<unknown> {
    throw new Error('Simplotel manage-booking API not connected yet.');
  }
};
