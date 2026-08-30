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
};

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
  const response = await fetch(
    "http://192.168.1.100:3000/api/simplotel/availability",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );

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
    const ratePlan = room.rate_plans?.[0];
    const occupancy = ratePlan?.occupancies?.[0];

    const roomPrice = Number(occupancy?.total_room_price ?? 0);
    const taxes = Number(occupancy?.total_taxes_and_fees ?? 0);

    return {
      stayId: String(room.room_type),
      roomName: String(room.name ?? "Room"),
      availableUnits: Number(room.availability ?? 0),
      totalAmount: roomPrice + taxes,
      currency: "INR" as const,
      ratePlanName: ratePlan?.name,
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
