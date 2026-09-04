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

  // Fetch all issues for the project (one query per 100 issues)
  const issueNodes: {
    identifier: string;
    title: string;
    priority: number;
    stateId: string | undefined;
    teamId: string | undefined;
    labelIds: string[];
    milestoneId: string | undefined;
    assigneeId: string | undefined;
  }[] = [];

  let hasNextPage = true;
  let afterCursor: string | undefined;

  while (hasNextPage) {
    const issuesPage = await project.issues({
      first: 100,
      ...(afterCursor ? { after: afterCursor } : {}),
    });

    for (const issue of issuesPage.nodes) {
      issueNodes.push({
        identifier: issue.identifier,
        title: issue.title,
        priority: issue.priority,
        stateId: issue.stateId,
        teamId: issue.teamId,
        labelIds: issue.labelIds ?? [],
        milestoneId: issue.projectMilestoneId,
        assigneeId: issue.assigneeId,
      });
    }

    hasNextPage = issuesPage.pageInfo.hasNextPage;
    afterCursor = issuesPage.pageInfo.endCursor ?? undefined;
  }

  // Collect team IDs from the project and from the issues
  const teamsConnection = await project.teams();
  const projectTeamMap = new Map(teamsConnection.nodes.map((t) => [t.id, t]));

  const missingTeamIds = new Set<string>();
  for (const issue of issueNodes) {
    if (issue.teamId && !projectTeamMap.has(issue.teamId)) {
      missingTeamIds.add(issue.teamId);
    }
  }

  // Fetch extra teams referenced by issues but not associated with the project
  for (const teamId of missingTeamIds) {
    const team = await client.team(teamId);
    if (team) projectTeamMap.set(team.id, team);
  }

  // Fetch workflow states from all relevant teams (one query per team)
  const statesMap = new Map<
    string,
    { id: string; name: string; type: string; color: string; position: number }
  >();

  for (const team of projectTeamMap.values()) {
    const states = await team.states({ first: 100 });
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

  // Fetch all issue labels in the workspace (one query per 100 labels)
  const labelsMap = new Map<string, { name: string; color: string }>();
  let labelsHasNextPage = true;
  let labelsAfterCursor: string | undefined;

  while (labelsHasNextPage) {
    const labelsPage = await client.issueLabels({
      first: 100,
      ...(labelsAfterCursor ? { after: labelsAfterCursor } : {}),
    });

    for (const label of labelsPage.nodes) {
      if (!labelsMap.has(label.id)) {
        labelsMap.set(label.id, { name: label.name, color: label.color });
      }
    }

    labelsHasNextPage = labelsPage.pageInfo.hasNextPage;
    labelsAfterCursor = labelsPage.pageInfo.endCursor ?? undefined;
  }

  // Fetch project milestones (one query per 100)
  const milestonesMap = new Map<string, string>();
  let milestonesHasNextPage = true;
  let milestonesAfterCursor: string | undefined;

  while (milestonesHasNextPage) {
    const milestonesPage = await project.projectMilestones({
      first: 100,
      ...(milestonesAfterCursor ? { after: milestonesAfterCursor } : {}),
    });

    for (const milestone of milestonesPage.nodes) {
      milestonesMap.set(milestone.id, milestone.name);
    }

    milestonesHasNextPage = milestonesPage.pageInfo.hasNextPage;
    milestonesAfterCursor = milestonesPage.pageInfo.endCursor ?? undefined;
  }

  // Fetch workspace users (one query per 100)
  const usersMap = new Map<string, string>();
  let usersHasNextPage = true;
  let usersAfterCursor: string | undefined;

  while (usersHasNextPage) {
    const usersPage = await client.users({
      first: 100,
      ...(usersAfterCursor ? { after: usersAfterCursor } : {}),
    });

    for (const user of usersPage.nodes) {
      usersMap.set(user.id, user.displayName || user.name || "Sin nombre");
    }

    usersHasNextPage = usersPage.pageInfo.hasNextPage;
    usersAfterCursor = usersPage.pageInfo.endCursor ?? undefined;
  }

  // Map issues to BoardIssue using the cached states and labels
  const allIssues: {
    identifier: string;
    title: string;
    priority: number;
    state: { id: string; name: string; type: string; color: string; position: number };
    labels: { name: string; color: string }[];
    milestone: string | null;
    assignee: string | null;
  }[] = [];

  for (const issue of issueNodes) {
    if (!issue.stateId || !statesMap.has(issue.stateId)) continue;
    const state = statesMap.get(issue.stateId)!;
    const labels = issue.labelIds
      .map((id) => labelsMap.get(id))
      .filter((l): l is { name: string; color: string } => !!l);

    allIssues.push({
      identifier: issue.identifier,
      title: issue.title,
      priority: issue.priority,
      state,
      labels,
      milestone: issue.milestoneId ? milestonesMap.get(issue.milestoneId) ?? null : null,
      assignee: issue.assigneeId ? usersMap.get(issue.assigneeId) ?? null : null,
    });
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
            milestone: i.milestone,
            assignee: i.assignee,
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

  const teamName = teamsConnection.nodes.length > 0 ? teamsConnection.nodes[0].name : "Sin equipo";

  return {
    team: teamName,
    project: projectProgress,
    columns,
    updatedAt: new Date().toISOString(),
  };
}
