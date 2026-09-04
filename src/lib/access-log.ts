import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

function getAccessLogDir() {
  return join(process.cwd(), ".cache", "access-log");
}

export async function logAccess(email: string) {
  const now = new Date();
  const line = JSON.stringify({ timestamp: now.toISOString(), email }) + "\n";
  try {
    const dir = getAccessLogDir();
    await mkdir(dir, { recursive: true });
    await appendFile(join(dir, "access.log"), line, "utf8");
  } catch (error) {
    console.error("No se pudo registrar el acceso:", error);
  }
}
