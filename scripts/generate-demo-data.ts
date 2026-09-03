import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { BoardData } from "../src/types/board";

const demoData: BoardData = {
  team: "Asimov CL",
  project: {
    name: "Framework y Sistema de Diseno GOB",
    progress: 35,
    state: "started",
    startDate: "2026-07-01",
    targetDate: "2026-12-15",
    totalIssues: 18,
    completedIssues: 6,
    canceledIssues: 1,
  },
  columns: [
    {
      id: "col-1",
      name: "Backlog",
      type: "backlog",
      color: "#bec2c8",
      position: 0,
      issues: [
        {
          identifier: "GOB-18",
          title: "Investigar frameworks de componentes existentes en gobierno",
          priority: 3,
          labels: [{ name: "Investigacion", color: "#7c5fc2" }],
        },
        {
          identifier: "GOB-17",
          title: "Documentar lineamientos de accesibilidad WCAG 2.1 AA",
          priority: 3,
          labels: [{ name: "Documentacion", color: "#4ea7fc" }],
        },
      ],
    },
    {
      id: "col-2",
      name: "Todo",
      type: "unstarted",
      color: "#e2e2e2",
      position: 1,
      issues: [
        {
          identifier: "GOB-16",
          title: "Definir tokens de diseno (colores, tipografia, espaciado)",
          priority: 2,
          labels: [{ name: "Diseno", color: "#f2994a" }],
        },
        {
          identifier: "GOB-15",
          title: "Crear componente Button con variantes primaria/secundaria",
          priority: 2,
          labels: [{ name: "Componente", color: "#27ae60" }],
        },
        {
          identifier: "GOB-14",
          title: "Implementar componente de formulario con validacion",
          priority: 3,
          labels: [{ name: "Componente", color: "#27ae60" }],
        },
        {
          identifier: "GOB-13",
          title: "Crear sistema de grid responsive basado en lineamientos GOB",
          priority: 2,
          labels: [{ name: "Layout", color: "#eb5757" }],
        },
      ],
    },
    {
      id: "col-3",
      name: "In Progress",
      type: "started",
      color: "#f2c94c",
      position: 2,
      issues: [
        {
          identifier: "GOB-12",
          title: "Configurar Storybook para documentacion de componentes",
          priority: 1,
          labels: [{ name: "Tooling", color: "#bb87fc" }],
        },
        {
          identifier: "GOB-11",
          title: "Implementar Header institucional con logo y navegacion",
          priority: 2,
          labels: [{ name: "Componente", color: "#27ae60" }],
        },
        {
          identifier: "GOB-10",
          title: "Crear componente Footer con links legales y redes sociales",
          priority: 2,
          labels: [{ name: "Componente", color: "#27ae60" }],
        },
      ],
    },
    {
      id: "col-4",
      name: "In Review",
      type: "started",
      color: "#da8b0d",
      position: 3,
      issues: [
        {
          identifier: "GOB-09",
          title: "Setup del monorepo con Turborepo y paquetes npm",
          priority: 1,
          labels: [{ name: "Tooling", color: "#bb87fc" }],
        },
        {
          identifier: "GOB-08",
          title: "Definir estructura base del proyecto y convenciones de codigo",
          priority: 2,
          labels: [{ name: "Arquitectura", color: "#2d9bf0" }],
        },
      ],
    },
    {
      id: "col-5",
      name: "Done",
      type: "completed",
      color: "#5e6ad2",
      position: 4,
      issues: [
        {
          identifier: "GOB-07",
          title: "Crear repositorio y configurar CI/CD basico",
          priority: 1,
          labels: [{ name: "Tooling", color: "#bb87fc" }],
        },
        {
          identifier: "GOB-06",
          title: "Definir alcance y requerimientos del sistema de diseno",
          priority: 1,
          labels: [{ name: "Planificacion", color: "#f2994a" }],
        },
        {
          identifier: "GOB-05",
          title:
            "Benchmark de sistemas de diseno gubernamentales (UK GDS, US WDS)",
          priority: 2,
          labels: [{ name: "Investigacion", color: "#7c5fc2" }],
        },
        {
          identifier: "GOB-04",
          title: "Seleccionar stack tecnologico (React + TypeScript + Tailwind)",
          priority: 1,
          labels: [{ name: "Arquitectura", color: "#2d9bf0" }],
        },
        {
          identifier: "GOB-03",
          title: "Configurar linter, prettier y husky para calidad de codigo",
          priority: 3,
          labels: [{ name: "Tooling", color: "#bb87fc" }],
        },
        {
          identifier: "GOB-02",
          title:
            "Crear guia de contribucion y onboarding para desarrolladores",
          priority: 3,
          labels: [{ name: "Documentacion", color: "#4ea7fc" }],
        },
      ],
    },
    {
      id: "col-6",
      name: "Canceled",
      type: "canceled",
      color: "#95a2b3",
      position: 5,
      issues: [
        {
          identifier: "GOB-01",
          title: "Evaluar uso de Angular como alternativa (descartado)",
          priority: 4,
          labels: [{ name: "Investigacion", color: "#7c5fc2" }],
        },
      ],
    },
  ],
  updatedAt: new Date().toISOString(),
};

const outDir = join(process.cwd(), "public", "data");
mkdirSync(outDir, { recursive: true });

const outPath = join(outDir, "board.json");
writeFileSync(outPath, JSON.stringify(demoData, null, 2), "utf-8");
console.log(`Datos de demo generados en ${outPath}`);
