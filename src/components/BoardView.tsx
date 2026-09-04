"use client";

import { useBoardData } from "@/hooks/useBoardData";
import { KanbanBoard } from "@/components/KanbanBoard";
import { AuthButton } from "@/components/AuthButton";

export function BoardView() {
  const { data, error, loading, lastFetch, refetch } = useBoardData();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
          <p className="text-sm text-muted">Cargando tablero...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            No se pudieron cargar los datos
          </h2>
          <p className="text-sm text-muted mb-4">
            Intenta actualizar el tablero más tarde.
          </p>
          <AuthButton action="logout" />
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 w-full">
      <KanbanBoard data={data} lastFetch={lastFetch} onRefresh={refetch} />
    </main>
  );
}
