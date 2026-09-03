import { LinearClient } from "@linear/sdk";
import type { BoardData, BoardColumn, BoardIssue, ProjectProgress } from "../types/board";

export function createLinearClient() {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    throw new Error("LINEAR_API_KEY no esta definida");
  }
  return new LinearClient({ apiKey });
}

export async function listProjects() {
  const client = createLinearClient();
  const projects = await client.projects({ first: 50 });
  return projects.nodes.map((p) => ({
    id: p.id,
    name: p.name,
    state: p.state,
    progress: Math.round(p.progress * 100),
  }));
}

export async function fetchBoardData(): Promise<BoardData> {
  const client = createLinearClient();

  const projectId = process.env.LINEAR_PROJECT_ID;
  if (!projectId) {
    throw new Error("LINEAR_PROJECT_ID no esta definida");
  }

  const project = await client.project(projectId);
  if (!project) {
    throw new Error(`Proyecto no encontrado: ${projectId}`);
  }

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
    const issuesPage = await project.issues({
      first: 100,
      ...(afterCursor ? { after: afterCursor } : {}),
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

  const statesMap = new Map<
    string,
    { id: string; name: string; type: string; color: string; position: number }
  >();

  for (const issue of allIssues) {
    if (!statesMap.has(issue.state.id)) {
      statesMap.set(issue.state.id, issue.state);
    }
  }

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

  const completedIssues = allIssues.filter((i) => i.state.type === "completed").length;
  const canceledIssues = allIssues.filter((i) => i.state.type === "canceled").length;

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
