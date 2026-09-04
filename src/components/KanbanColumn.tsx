import type { BoardColumn } from "@/types/board";
import { IssueCard } from "./IssueCard";

export function KanbanColumn({ column }: { column: BoardColumn }) {
  return (
    <div className="flex flex-col min-w-[260px] flex-1 h-full">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: column.color }}
        />
        <h3 className="text-sm font-semibold text-foreground truncate">
          {column.name}
        </h3>
        <span className="text-xs text-muted font-medium ml-auto">
          {column.issues.length}
        </span>
      </div>

      {/* Issue cards */}
      <div className="flex flex-col gap-2 overflow-y-auto pr-1 pb-4 flex-1">
        {column.issues.length === 0 ? (
          <p className="text-xs text-subtle text-center py-6">
            Sin issues
          </p>
        ) : (
          column.issues.map((issue) => (
            <IssueCard key={issue.identifier} issue={issue} />
          ))
        )}
      </div>
    </div>
  );
}
