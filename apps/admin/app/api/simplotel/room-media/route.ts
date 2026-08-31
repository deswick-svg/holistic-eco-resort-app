import { NextResponse } from "next/server";
import {
  retrieveAllRoomMedia,
  type RoomMedia,
} from "../../../../lib/simplotel/roomMedia";

export const runtime = "nodejs";

export async function GET() {
  const results = await retrieveAllRoomMedia();
  const rooms: Record<string, RoomMedia> = {};
  const errors: Record<string, string> = {};

  for (const result of results) {
    if (result.ok) {
      rooms[result.media.roomTypeId] = result.media;
    } else {
      errors[result.room.roomTypeId] = result.error;
      console.error(
        `Room media retrieval failed for ${result.room.roomTypeId}:`,
        result.error
      );
    }
  }

  return NextResponse.json(
    {
      rooms,
      errors,
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control":
          "public, max-age=300, s-maxage=21600, stale-while-revalidate=86400",
      },
    }
  );
}
