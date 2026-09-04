import { NextResponse } from "next/server";
import { fetchBoardData } from "@/lib/linear";
import { getAuthorizedSession } from "@/lib/auth";
import { getBoardCacheFile } from "@/lib/board-cache-path";
import type { BoardData } from "@/types/board";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { dirname } from "path";

const CACHE_FILE = getBoardCacheFile();
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
    mkdirSync(dirname(CACHE_FILE), { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), { encoding: "utf-8", mode: 0o600 });
  } catch {
    // Si no podemos escribir cache, seguimos sin fallar
  }
}

function json(data: BoardData | { error: string }, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
}

export async function GET() {
  if (!(await getAuthorizedSession())) {
    return json({ error: "Debes iniciar sesión con una cuenta autorizada." }, 401);
  }

  const cache = readCache();
  const now = Date.now();

  if (cache && now - cache.mtime < CACHE_TTL) {
    return json(cache.data);
  }

  if (fetching) {
    try {
      const data = await fetching;
      return json(data);
    } catch {
      return json({ error: "No se pudieron actualizar los datos. Intenta más tarde." }, 503);
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
    return json(data);
  } catch {
    return json({ error: "No se pudieron actualizar los datos. Intenta más tarde." }, 503);
  }
}
