import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { status: "ok", service: "holistic-eco-resort-beta-backend" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
