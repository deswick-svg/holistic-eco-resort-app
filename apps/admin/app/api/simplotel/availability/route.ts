import { NextResponse } from "next/server";

const SIMPLOTEL_HOTEL_ID = 7849;
const SIMPLOTEL_ACCESS_TOKEN = process.env.SIMPLOTEL_ACCESS_TOKEN;

export async function POST(request: Request) {
  try {
    if (!SIMPLOTEL_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Simplotel access token is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const checkIn = body.checkIn;
    const checkOut = body.checkOut;
    const adults = Number(body.adults ?? 2);
    const children = Number(body.children ?? 0);
    const rooms = Number(body.rooms ?? 1);

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: "checkIn and checkOut are required." },
        { status: 400 }
      );
    }

    const simplotelBody = {
      checkIn,
      checkOut,
      rooms: Array.from({ length: rooms }, (_, index) => ({
        id: index + 1,
        adults,
        children,
      })),
      propertyId: SIMPLOTEL_HOTEL_ID,
    };

    const response = await fetch(
      `https://admin.simplotel.com/api/v1/hotel/${SIMPLOTEL_HOTEL_ID}/voice-bot/availability`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SIMPLOTEL_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(simplotelBody),
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Simplotel availability request failed.",
          details: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Simplotel availability error:", error);

    return NextResponse.json(
      { error: "Unable to check Simplotel availability." },
      { status: 500 }
    );
  }
}