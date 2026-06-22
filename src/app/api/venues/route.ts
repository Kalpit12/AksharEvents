import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const venues = await prisma.venue.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { events: true } },
      },
    });

    return NextResponse.json(venues);
  } catch (error) {
    console.error("Venues fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch venues" },
      { status: 500 }
    );
  }
}
