import { createHash } from "node:crypto";
import { join } from "node:path";

export function getBoardCacheFile() {
  const project = createHash("sha256")
    .update(process.env.LINEAR_PROJECT_ID ?? "")
    .digest("hex");
  return join(process.cwd(), ".cache", "linear", `${project}.json`);
}
