# Kanban Linear - Tablero Publico

Tablero kanban publico que muestra el estado de un proyecto de [Linear](https://linear.app) para compartir con clientes. Los datos se generan mediante un script que consulta la API de Linear y produce un JSON estatico, sin exponer la API key al navegador.

## Stack

- **Next.js 16** (React 19, App Router)
- **Tailwind CSS 4**
- **@linear/sdk** para consultar la API de Linear
- **TypeScript**

## Inicio rapido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar la API key de Linear

Crea un archivo `.env.local` en la raiz del proyecto:

```bash
cp env.example .env.local
```

Edita `.env.local` con tu API key y el ID del proyecto:

```env
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxxxxxxx
LINEAR_PROJECT_ID=12fde5cf-06c4-xxxx-xxxx-xxxxxxxxxxxx
```

**Obtener la API key:** Ve a [Linear > Settings > Account > Security & Access](https://linear.app/settings/account/security) y crea una nueva API key con permisos de solo lectura (Read).

**Obtener el ID del proyecto:** Ejecuta:

```bash
npm run list-projects
```

### 3. Generar los datos del tablero

```bash
npm run fetch-data
```

Esto crea `public/data/board.json` con los datos del proyecto.

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver el tablero.

## Modo demo

Si quieres ver el tablero sin configurar Linear, puedes generar datos de ejemplo:

```bash
npx tsx scripts/generate-demo-data.ts
npm run dev
```

## Actualizacion automatica

### Opcion A: Cron del sistema

```bash
# Actualizar cada 5 minutos
*/5 * * * * cd /ruta/al/proyecto && npm run fetch-data
```

### Opcion B: GitHub Actions

Crea `.github/workflows/update-board.yml`:

```yaml
name: Update board data
on:
  schedule:
    - cron: '*/10 * * * *'  # cada 10 minutos
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run fetch-data
        env:
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
          LINEAR_PROJECT_ID: ${{ secrets.LINEAR_PROJECT_ID }}
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: update board data"
          file_pattern: public/data/board.json
```

### Opcion C: Vercel Cron

Si despliegas en Vercel, puedes crear un API route que regenere los datos y configurarlo como cron job en `vercel.json`.

## Estructura del proyecto

```
kanban_linear/
├── scripts/
│   ├── fetch-linear-data.ts    # Genera board.json desde la API de Linear
│   └── generate-demo-data.ts   # Genera datos de ejemplo
├── public/data/
│   └── board.json              # Datos generados (gitignored)
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanColumn.tsx
│   │   ├── IssueCard.tsx
│   │   └── ProgressBar.tsx
│   ├── hooks/
│   │   └── useBoardData.ts     # Polling cada 60s
│   └── types/
│       └── board.ts
├── env.example
└── package.json
```

## Scripts disponibles

| Comando | Descripcion |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de produccion |
| `npm run fetch-data` | Obtener datos desde Linear API |
| `npm run list-projects` | Listar proyectos disponibles en Linear |

## Seguridad

- La API key de Linear **nunca se expone al navegador**
- El JSON generado solo contiene titulos, identificadores y labels
- No se incluyen emails, nombres de usuario, ni datos sensibles
- El tablero es de **solo lectura**
