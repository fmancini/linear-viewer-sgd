import { NextResponse } from "next/server";
import { fetchBoardData } from "@/lib/linear";
import type { BoardData } from "@/types/board";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";

const CACHE_FILE = join(process.cwd(), "public", "data", "board.json");
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

let fetching: Promise<BoardData> | null = null;

function readCache(): { data: BoardData; mtime: number } | null {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    const stats = statSync(CACHE_FILE);
    const data = JSON.parse(readFileSync(CACHE_FILE, "utf-8")) as BoardData;
    return { data, mtime: stats.mtimeMs };
  } catch {
    return null;
  }
}

function writeCache(data: BoardData) {
  try {
    mkdirSync(join(process.cwd(), "public", "data"), { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Si no podemos escribir cache, seguimos sin fallar
  }
}

export async function GET() {
  const cache = readCache();
  const now = Date.now();

  if (cache && now - cache.mtime < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  if (fetching) {
    try {
      const data = await fetching;
      return NextResponse.json(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  fetching = (async () => {
    try {
      const data = await fetchBoardData();
      writeCache(data);
      return data;
    } catch (error) {
      if (cache) {
        // Si falla, re-usamos cache existente y actualizamos su mtime
        // para no volver a golpear Linear mientras dure el problema
        writeCache(cache.data);
        return cache.data;
      }
      throw error;
    } finally {
      fetching = null;
    }
  })();

  try {
    const data = await fetching;
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
