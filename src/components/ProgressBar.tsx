import type { ProjectProgress } from "@/types/board";

const stateLabels: Record<string, string> = {
  planned: "Planificado",
  started: "En curso",
  paused: "Pausado",
  completed: "Completado",
  canceled: "Cancelado",
};

export function ProgressBar({ project }: { project: ProjectProgress }) {
  const activeIssues =
    project.totalIssues - project.completedIssues - project.canceledIssues;

  const completedPercent =
    project.totalIssues > 0
      ? Math.round((project.completedIssues / project.totalIssues) * 100)
      : 0;

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-foreground">{project.name}</h2>
        <span className="text-sm font-medium text-muted">
          {stateLabels[project.state] ?? project.state}
        </span>
      </div>

      {/* Dates */}
      {(project.startDate || project.targetDate) && (
        <p className="text-xs text-subtle mb-3">
          {project.startDate && (
            <span>Inicio: {new Date(project.startDate).toLocaleDateString("es-CL")}</span>
          )}
          {project.startDate && project.targetDate && <span> &middot; </span>}
          {project.targetDate && (
            <span>Meta: {new Date(project.targetDate).toLocaleDateString("es-CL")}</span>
          )}
        </p>
      )}

      {/* Progress bar */}
      <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-500"
          style={{ width: `${Math.min(completedPercent, 100)}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mt-2">
        <div>
          <span className="text-2xl font-bold text-foreground">
            {completedPercent}%
          </span>
          <p className="text-[10px] text-subtle">Completado del total cargado</p>
        </div>
        <div className="flex gap-4 text-xs text-muted">
          <span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {project.completedIssues}
            </span>{" "}
            completados
          </span>
          <span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">{activeIssues}</span>{" "}
            activos
          </span>
          <span>
            <span className="font-semibold text-subtle">
              {project.totalIssues}
            </span>{" "}
            total
          </span>
        </div>
      </div>
    </div>
  );
}
