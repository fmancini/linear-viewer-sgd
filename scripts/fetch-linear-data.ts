import { LinearClient } from "@linear/sdk";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type {
  BoardData,
  BoardColumn,
  BoardIssue,
  ProjectProgress,
} from "../src/types/board";

const API_KEY = process.env.LINEAR_API_KEY;
const PROJECT_ID = process.env.LINEAR_PROJECT_ID;

if (!API_KEY) {
  console.error("ERROR: LINEAR_API_KEY no esta definida en .env.local");
  console.error("Crea un archivo .env.local con tu API key de Linear.");
  console.error("Ver env.example para referencia.");
  process.exit(1);
}

if (!PROJECT_ID) {
  console.error("ERROR: LINEAR_PROJECT_ID no esta definida en .env.local");
  process.exit(1);
}

const client = new LinearClient({ apiKey: API_KEY });

async function listProjects() {
  const projects = await client.projects({ first: 50 });
  console.log("\nProyectos disponibles:\n");
  for (const p of projects.nodes) {
    console.log(`  ${p.name}`);
    console.log(`    ID: ${p.id}`);
    console.log(`    Estado: ${p.state}`);
    console.log(`    Progreso: ${Math.round(p.progress * 100)}%`);
    console.log();
  }
}

async function fetchBoardData(): Promise<BoardData> {
  console.log("Obteniendo datos del proyecto...");

  // Fetch the project
  const project = await client.project(PROJECT_ID!);
  if (!project) {
    throw new Error(`Proyecto no encontrado: ${PROJECT_ID}`);
  }
  console.log(`Proyecto: ${project.name}`);

  // Fetch all issues for this project with pagination
  const allIssues: {
    identifier: string;
    title: string;
    priority: number;
    state: { id: string; name: string; type: string; color: string; position: number };
    labels: { name: string; color: string }[];
  }[] = [];

  let hasNextPage = true;
  let afterCursor: string | undefined;

  while (hasNextPage) {
    const issuesPage = await client.issues({
      first: 100,
      after: afterCursor,
      filter: { project: { id: { eq: PROJECT_ID } } },
    });

    for (const issue of issuesPage.nodes) {
      const state = await issue.state;
      const labelsConnection = await issue.labels();

      if (state) {
        allIssues.push({
          identifier: issue.identifier,
          title: issue.title,
          priority: issue.priority,
          state: {
            id: state.id,
            name: state.name,
            type: state.type,
            color: state.color,
            position: state.position,
          },
          labels: labelsConnection.nodes.map((l) => ({
            name: l.name,
            color: l.color,
          })),
        });
      }
    }

    hasNextPage = issuesPage.pageInfo.hasNextPage;
    afterCursor = issuesPage.pageInfo.endCursor ?? undefined;
  }

  console.log(`Issues encontrados: ${allIssues.length}`);

  // Get unique workflow states from fetched issues and build columns
  const statesMap = new Map<
    string,
    { id: string; name: string; type: string; color: string; position: number }
  >();

  for (const issue of allIssues) {
    if (!statesMap.has(issue.state.id)) {
      statesMap.set(issue.state.id, issue.state);
    }
  }

  // Also fetch team states to get complete workflow (even empty columns)
  const teams = await project.teams();
  if (teams.nodes.length > 0) {
    const team = teams.nodes[0];
    const states = await team.states();
    for (const state of states.nodes) {
      if (!statesMap.has(state.id)) {
        statesMap.set(state.id, {
          id: state.id,
          name: state.name,
          type: state.type,
          color: state.color,
          position: state.position,
        });
      }
    }
  }

  // Build columns sorted by type order then position
  const typeOrder: Record<string, number> = {
    triage: 0,
    backlog: 1,
    unstarted: 2,
    started: 3,
    completed: 4,
    canceled: 5,
  };

  const columns: BoardColumn[] = Array.from(statesMap.values())
    .sort((a, b) => {
      const typeA = typeOrder[a.type] ?? 99;
      const typeB = typeOrder[b.type] ?? 99;
      if (typeA !== typeB) return typeA - typeB;
      return a.position - b.position;
    })
    .map((state) => ({
      id: state.id,
      name: state.name,
      type: state.type as BoardColumn["type"],
      color: state.color,
      position: state.position,
      issues: allIssues
        .filter((i) => i.state.id === state.id)
        .sort((a, b) => a.priority - b.priority)
        .map(
          (i): BoardIssue => ({
            identifier: i.identifier,
            title: i.title,
            priority: i.priority,
            labels: i.labels,
          })
        ),
    }));

  // Calculate project progress
  const completedIssues = allIssues.filter(
    (i) => i.state.type === "completed"
  ).length;
  const canceledIssues = allIssues.filter(
    (i) => i.state.type === "canceled"
  ).length;

  const projectProgress: ProjectProgress = {
    name: project.name,
    progress: Math.round(project.progress * 100),
    state: project.state,
    startDate: project.startDate ?? null,
    targetDate: project.targetDate ?? null,
    totalIssues: allIssues.length,
    completedIssues,
    canceledIssues,
  };

  const teamName = teams.nodes.length > 0 ? teams.nodes[0].name : "Sin equipo";

  return {
    team: teamName,
    project: projectProgress,
    columns,
    updatedAt: new Date().toISOString(),
  };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list-projects")) {
    await listProjects();
    return;
  }

  const data = await fetchBoardData();

  const outDir = join(process.cwd(), "public", "data");
  mkdirSync(outDir, { recursive: true });

  const outPath = join(outDir, "board.json");
  writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");

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
