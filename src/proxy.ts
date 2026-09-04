import { NextResponse } from "next/server";

export function proxy() {
  return new NextResponse(null, {
    status: 404,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export const config = { matcher: ["/data/:path*"] };
