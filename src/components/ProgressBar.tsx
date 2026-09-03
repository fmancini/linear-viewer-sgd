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

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
        <span className="text-sm font-medium text-gray-500">
          {stateLabels[project.state] ?? project.state}
        </span>
      </div>

      {/* Dates */}
      {(project.startDate || project.targetDate) && (
        <p className="text-xs text-gray-400 mb-3">
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
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${Math.min(project.progress, 100)}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-2xl font-bold text-gray-900">
          {project.progress}%
        </span>
        <div className="flex gap-4 text-xs text-gray-500">
          <span>
            <span className="font-semibold text-green-600">
              {project.completedIssues}
            </span>{" "}
            completados
          </span>
          <span>
            <span className="font-semibold text-blue-600">{activeIssues}</span>{" "}
            activos
          </span>
          <span>
            <span className="font-semibold text-gray-400">
              {project.totalIssues}
            </span>{" "}
            total
          </span>
        </div>
      </div>
    </div>
  );
}
