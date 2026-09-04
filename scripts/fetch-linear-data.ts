import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { fetchBoardData, listProjects } from "../src/lib/linear";
import { getBoardCacheFile } from "../src/lib/board-cache-path";

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list-projects")) {
    const projects = await listProjects();
    console.log("\nProyectos disponibles:\n");
    for (const p of projects) {
      console.log(`  ${p.name}`);
      console.log(`    ID: ${p.id}`);
      console.log(`    Estado: ${p.state}`);
      console.log(`    Progreso: ${p.progress}%`);
      console.log();
    }
    return;
  }

  const data = await fetchBoardData();

  const outPath = getBoardCacheFile();
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(data, null, 2), { encoding: "utf-8", mode: 0o600 });

  console.log(`\nDatos guardados en ${outPath}`);
  console.log(`Equipo: ${data.team}`);
  console.log(`Proyecto: ${data.project.name} (${data.project.progress}%)`);
  console.log(`Columnas: ${data.columns.map((c) => `${c.name} (${c.issues.length})`).join(", ")}`);
  console.log(`Total issues: ${data.project.totalIssues}`);
  console.log(`Ultima actualizacion: ${data.updatedAt}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
