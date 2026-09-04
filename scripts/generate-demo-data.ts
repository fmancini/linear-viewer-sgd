import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { BoardData, BoardIssue } from "../src/types/board";

const columnDefs = [
  { id: "col-1", name: "Backlog", type: "backlog" as const, color: "#bec2c8", position: 0 },
  { id: "col-2", name: "Todo", type: "unstarted" as const, color: "#e2e2e2", position: 1 },
  { id: "col-3", name: "In Progress", type: "started" as const, color: "#f2c94c", position: 2 },
  { id: "col-4", name: "In Review", type: "started" as const, color: "#da8b0d", position: 3 },
  { id: "col-5", name: "Done", type: "completed" as const, color: "#5e6ad2", position: 4 },
  { id: "col-6", name: "Canceled", type: "canceled" as const, color: "#95a2b3", position: 5 },
];

const labelsPool = [
  { name: "Investigacion", color: "#7c5fc2" },
  { name: "Documentacion", color: "#4ea7fc" },
  { name: "Diseno", color: "#f2994a" },
  { name: "Componente", color: "#27ae60" },
  { name: "Layout", color: "#eb5757" },
  { name: "Tooling", color: "#bb87fc" },
  { name: "Arquitectura", color: "#2d9bf0" },
  { name: "Planificacion", color: "#f2994a" },
];

const issuesSeed = [
  { title: "Investigar frameworks de componentes existentes en gobierno", priority: 3, label: "Investigacion", milestone: "Descubrimiento", assignee: "Ana" },
  { title: "Documentar lineamientos de accesibilidad WCAG 2.1 AA", priority: 3, label: "Documentacion", milestone: "Descubrimiento", assignee: "Carlos" },
  { title: "Definir tokens de diseno (colores, tipografia, espaciado)", priority: 2, label: "Diseno", milestone: "Fundamentos", assignee: "Sofia" },
  { title: "Crear componente Button con variantes primaria/secundaria", priority: 2, label: "Componente", milestone: "Fundamentos", assignee: "Mateo" },
  { title: "Implementar componente de formulario con validacion", priority: 3, label: "Componente", milestone: "Fundamentos", assignee: "Mateo" },
  { title: "Crear sistema de grid responsive basado en lineamientos GOB", priority: 2, label: "Layout", milestone: "Fundamentos", assignee: "Sofia" },
  { title: "Configurar Storybook para documentacion de componentes", priority: 1, label: "Tooling", milestone: "Fundamentos", assignee: "Diego" },
  { title: "Implementar Header institucional con logo y navegacion", priority: 2, label: "Componente", milestone: "Componentes base", assignee: "Sofia" },
  { title: "Crear componente Footer con links legales y redes sociales", priority: 2, label: "Componente", milestone: "Componentes base", assignee: "Ana" },
  { title: "Setup del monorepo con Turborepo y paquetes npm", priority: 1, label: "Tooling", milestone: "Componentes base", assignee: "Diego" },
  { title: "Definir estructura base del proyecto y convenciones de codigo", priority: 2, label: "Arquitectura", milestone: "Componentes base", assignee: "Carlos" },
  { title: "Crear repositorio y configurar CI/CD basico", priority: 1, label: "Tooling", milestone: "Lanzamiento", assignee: "Diego" },
  { title: "Definir alcance y requerimientos del sistema de diseno", priority: 1, label: "Planificacion", milestone: "Descubrimiento", assignee: "Carlos" },
  { title: "Benchmark de sistemas de diseno gubernamentales (UK GDS, US WDS)", priority: 2, label: "Investigacion", milestone: "Descubrimiento", assignee: "Ana" },
  { title: "Seleccionar stack tecnologico (React + TypeScript + Tailwind)", priority: 1, label: "Arquitectura", milestone: "Lanzamiento", assignee: "Carlos" },
  { title: "Configurar linter, prettier y husky para calidad de codigo", priority: 3, label: "Tooling", milestone: "Lanzamiento", assignee: "Mateo" },
  { title: "Crear guia de contribucion y onboarding para desarrolladores", priority: 3, label: "Documentacion", milestone: "Lanzamiento", assignee: "Sofia" },
  { title: "Evaluar uso de Angular como alternativa (descartado)", priority: 4, label: "Investigacion", milestone: null, assignee: null },
];

const distribution = [2, 4, 3, 2, 6, 1];
let issueIndex = 0;

function makeIssue(seed: (typeof issuesSeed)[number]): BoardIssue {
  const label = labelsPool.find((l) => l.name === seed.label) ?? labelsPool[0];
  return {
    identifier: `GOB-${String(issueIndex++).padStart(2, "0")}`,
    title: seed.title,
    priority: seed.priority,
    labels: [label],
    milestone: seed.milestone,
    assignee: seed.assignee,
  };
}

const columns = columnDefs.map((col, i) => {
  const count = distribution[i] ?? 0;
  const issues: BoardIssue[] = [];
  for (let j = 0; j < count; j++) {
    const seed = issuesSeed[issueIndex++];
    if (seed) issues.push(makeIssue(seed));
  }
  return { ...col, issues };
});

const totalIssues = columns.reduce((acc, col) => acc + col.issues.length, 0);

const demoData: BoardData = {
  team: "Asimov CL",
  project: {
    name: "Framework y Sistema de Diseno GOB",
    progress: 35,
    state: "started",
    startDate: "2026-07-01",
    targetDate: "2026-12-15",
    totalIssues,
    completedIssues: columns.find((c) => c.name === "Done")?.issues.length ?? 0,
    canceledIssues: columns.find((c) => c.name === "Canceled")?.issues.length ?? 0,
  },
  columns,
  updatedAt: new Date().toISOString(),
};

const outDir = join(process.cwd(), "public", "data");
mkdirSync(outDir, { recursive: true });

const outPath = join(outDir, "board.json");
writeFileSync(outPath, JSON.stringify(demoData, null, 2), "utf-8");
console.log(`Datos de demo generados en ${outPath}`);
