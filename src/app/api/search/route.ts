import { NextResponse } from "next/server";
import { globalSearch } from "@/lib/events";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const { success } = rateLimit(`search:${ip}`, 60);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  const results = await globalSearch(q);
  return NextResponse.json(results);
}
