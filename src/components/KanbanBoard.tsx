"use client";

import type { BoardData } from "@/types/board";
import { KanbanColumn } from "./KanbanColumn";
import { ProgressBar } from "./ProgressBar";

interface KanbanBoardProps {
  data: BoardData;
  lastFetch: Date | null;
  onRefresh: () => void;
}

export function KanbanBoard({ data, lastFetch, onRefresh }: KanbanBoardProps) {
  // Filter out canceled column if empty (less visual noise)
  const visibleColumns = data.columns.filter(
    (col) => col.type !== "canceled" || col.issues.length > 0
  );

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.team}</h1>
          <p className="text-sm text-gray-400">Tablero publico del proyecto</p>
        </div>
        <div className="flex items-center gap-3">
          {lastFetch && (
            <span className="text-xs text-gray-400">
              Actualizado:{" "}
              {lastFetch.toLocaleTimeString("es-CL", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <button
            onClick={onRefresh}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 rounded-lg border border-indigo-200 hover:border-indigo-300 transition-colors cursor-pointer"
          >
            Actualizar
          </button>
        </div>
      </header>

      {/* Progress */}
      <ProgressBar project={data.project} />

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto flex-1 pb-4">
        {visibleColumns.map((column) => (
          <KanbanColumn key={column.id} column={column} />
        ))}
      </div>
    </div>
  );
}
