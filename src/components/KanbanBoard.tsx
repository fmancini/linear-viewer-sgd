"use client";

import { useRef, useState } from "react";
import type { BoardData } from "@/types/board";
import { KanbanColumn } from "./KanbanColumn";
import { ProgressBar } from "./ProgressBar";
import { ThemeToggle } from "./ThemeToggle";
import { AuthButton } from "./AuthButton";
import { APP_VERSION } from "@/lib/app-version";

interface KanbanBoardProps {
  data: BoardData;
  lastFetch: Date | null;
  onRefresh: () => void;
}

export function KanbanBoard({ data, lastFetch, onRefresh }: KanbanBoardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; scrollLeft: number } | null>(null);

  // Filter out canceled column if empty (less visual noise)
  const visibleColumns = data.columns.filter(
    (col) => col.type !== "canceled" || col.issues.length > 0
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Ignore interactions with buttons, links and cards to keep their native behavior
    if (target.closest("button, a, [role=button]")) return;
    if (!scrollRef.current) return;

    dragStart.current = {
      x: e.clientX,
      scrollLeft: scrollRef.current.scrollLeft,
    };
    setIsDragging(true);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart.current || !scrollRef.current) return;
    const dx = e.clientX - dragStart.current.x;
    scrollRef.current.scrollLeft = dragStart.current.scrollLeft - dx;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    dragStart.current = null;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if capture was already released
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    dragStart.current = null;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{data.team}</h1>
          <p className="text-sm text-subtle">Tablero privado del proyecto</p>
        </div>
        <div className="flex items-center gap-3">
          {lastFetch && (
            <span className="text-xs text-subtle">
              Actualizado:{" "}
              {lastFetch.toLocaleTimeString("es-CL", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <ThemeToggle />
          <AuthButton action="logout" />
          <button
            onClick={onRefresh}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 border-indigo-200 hover:border-indigo-300 dark:border-indigo-900/50 dark:hover:border-indigo-700"
          >
            Actualizar
          </button>
        </div>
      </header>

      {/* Progress */}
      <ProgressBar project={data.project} />

      {/* Kanban columns */}
      <div
        ref={scrollRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={() => setIsDragging(false)}
        className={`flex gap-4 overflow-x-auto flex-1 pb-4 w-full ${
          isDragging ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
      >
        {visibleColumns.map((column) => (
          <KanbanColumn key={column.id} column={column} />
        ))}
      </div>

      <p className="text-center text-xs text-subtle">v{APP_VERSION}</p>
    </div>
  );
}
