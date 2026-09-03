export type WorkflowStateType =
  | "triage"
  | "backlog"
  | "unstarted"
  | "started"
  | "completed"
  | "canceled";

export interface BoardIssue {
  identifier: string;
  title: string;
  priority: number; // 0=None, 1=Urgent, 2=High, 3=Medium, 4=Low
  labels: { name: string; color: string }[];
}

export interface BoardColumn {
  id: string;
  name: string;
  type: WorkflowStateType;
  color: string;
  position: number;
  issues: BoardIssue[];
}

export interface ProjectProgress {
  name: string;
  progress: number; // 0-100
  state: string;
  startDate: string | null;
  targetDate: string | null;
  totalIssues: number;
  completedIssues: number;
  canceledIssues: number;
}

export interface BoardData {
  team: string;
  project: ProjectProgress;
  columns: BoardColumn[];
  updatedAt: string;
}
