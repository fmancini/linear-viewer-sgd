import { NextResponse } from "next/server";
import { fetchBoardData } from "@/lib/linear";
import type { BoardData } from "@/types/board";

let cache: { data: BoardData; ts: number } | null = null;
const CACHE_TTL = 60_000; // 1 minuto

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const data = await fetchBoardData();
    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
