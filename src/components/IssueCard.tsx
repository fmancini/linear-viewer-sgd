import type { BoardIssue } from "@/types/board";

const priorityConfig: Record<number, { label: string; class: string }> = {
  0: { label: "", class: "" },
  1: {
    label: "Urgente",
    class:
      "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200",
  },
  2: {
    label: "Alta",
    class:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200",
  },
  3: {
    label: "Media",
    class:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200",
  },
  4: {
    label: "Baja",
    class:
      "bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-300",
  },
};

export function IssueCard({ issue }: { issue: BoardIssue }) {
  const priority = priorityConfig[issue.priority] ?? priorityConfig[0];

  return (
    <div className="bg-card rounded-lg border border-border p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-2">
        <span className="text-xs font-mono text-subtle shrink-0 mt-0.5">
          {issue.identifier}
        </span>
        <p className="text-sm text-card-foreground leading-snug font-medium line-clamp-2">
          {issue.title}
        </p>
      </div>

      {(priority.label || issue.labels.length > 0) && (
        <div className="flex flex-wrap gap-1 mt-2">
          {priority.label && (
            <span
              className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${priority.class}`}
            >
              {priority.label}
            </span>
          )}
          {issue.labels.map((label) => (
            <span
              key={label.name}
              className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${label.color}20`,
                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {(issue.milestone || issue.assignee) && (
        <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-subtle">
          {issue.milestone && (
            <span className="truncate" title={issue.milestone}>
              <span className="font-medium text-muted">Hito:</span> {issue.milestone}
            </span>
          )}
          {issue.assignee && (
            <span className="truncate" title={issue.assignee}>
              <span className="font-medium text-muted">Asignado:</span> {issue.assignee}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
