# Kanban Linear - Tablero Privado

Tablero kanban de un proyecto de [Linear](https://linear.app) protegido con Google OAuth. Solo pueden acceder los correos verificados cuyo dominio esta incluido en `AUTH_ALLOWED_DOMAINS`. El servidor consulta Linear y guarda una cache privada; la API key no se envia al navegador.

## Stack

- **Next.js 16** (React 19, App Router)
- **Tailwind CSS 4**
- **@linear/sdk** para consultar la API de Linear
- **TypeScript**

## Acceso con Google (obligatorio)

Configura estas variables en `.env` o `.env.local`, y por separado en Railway:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
AUTH_ALLOWED_DOMAINS=asimov.cl,digital.gob.cl
```

`NEXTAUTH_SECRET` debe ser aleatorio y tener al menos 32 caracteres. Puedes generar uno con `openssl rand -base64 32` y guardarlo de forma privada. No publiques secretos ni los incluyas en Git. Para Railway, usa `NEXTAUTH_URL=https://linear-viewer-sgd-production.up.railway.app`.

Registra en Google las URI de redireccion exactas:

- `http://localhost:3000/api/auth/callback/google`
- `https://linear-viewer-sgd-production.up.railway.app/api/auth/callback/google`

`AUTH_ALLOWED_DOMAINS` admite dominios separados por comas; se acepta cualquier correo verificado por Google cuyo dominio coincida exactamente (sin subdominios ni sufijos). Se valida en el login y en cada acceso al tablero/API. Reinicia o redespliega al cambiar variables. Sin configuracion completa, el acceso queda bloqueado. Las sesiones duran hasta 8 horas; el boton Cerrar sesion elimina la cookie del navegador.

Cada inicio de sesion exitoso queda registrado en `.cache/access-log/access.log` (una linea JSON con `timestamp` ISO y `email` por acceso), fuera de `public` y sin publicarse via `/data/*`.

No necesitas ejecutar `fetch-data` para usar el tablero: `/api/board` actualiza los datos cuando vence su cache de 5 minutos. El build de Railway sigue siendo `npm run build`, y el inicio `npm run start`. La cache esta en `.cache/linear/`, fuera de `public`, y `/data/*` esta bloqueado incluso si quedan archivos antiguos. El disco de Railway puede perder la cache en cada despliegue; no es necesario un volumen para autenticar usuarios.

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

### 3. Generar los datos del tablero (opcional)

```bash
node --env-file=.env --import tsx scripts/fetch-linear-data.ts
```

Esto precarga la cache privada en `.cache/linear/`, separada por proyecto. Cambia `.env` por `.env.local` si usas ese archivo. La API tambien genera la cache automaticamente tras autenticar al usuario.

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver el tablero.

## Modo demo

Puedes generar un archivo de ejemplo en `.cache/demo/board.json`. No lo publica la API ni permite omitir el login:

```bash
npx tsx scripts/generate-demo-data.ts
npm run dev
```

## Actualizacion automatica

Las opciones siguientes son ejemplos historicos del tablero publico, no instrucciones para el despliegue privado actual. No uses el workflow que publica `public/data/board.json` en GitHub. El endpoint autenticado y su cache privada sustituyen ese flujo.

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
│   ├── fetch-linear-data.ts        # Genera board.json desde la API de Linear
│   ├── generate-demo-data.ts       # Genera datos de ejemplo
│   ├── auth.test.ts                # Pruebas de politica de acceso y callbacks
│   └── auth-integration.test.ts    # Prueba HTTP de produccion (127.0.0.1:3017)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts  # Endpoints de NextAuth
│   │   │   └── board/route.ts               # Datos del tablero (protegido)
│   │   ├── login/page.tsx          # Pantalla de login con Google
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                # Redirige a /login o muestra el tablero
│   ├── components/
│   │   ├── BoardView.tsx           # Estados de carga/error del tablero
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanColumn.tsx
│   │   ├── IssueCard.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── AuthButton.tsx          # Botones de login/logout
│   │   └── ThemeToggle.tsx
│   ├── hooks/
│   │   └── useBoardData.ts         # Polling cada 60s
│   ├── lib/
│   │   ├── auth.ts                 # Configuracion de NextAuth
│   │   ├── auth-policy.ts          # Validacion de dominio permitido
│   │   ├── access-log.ts           # Log de accesos (.cache/access-log/)
│   │   ├── app-version.ts          # Version de la app (desde package.json)
│   │   ├── board-cache-path.ts     # Ruta de cache por proyecto
│   │   └── linear.ts
│   ├── proxy.ts                    # Bloquea /data/* (archivos legacy)
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
| `npm run start` | Inicia el build de produccion |
| `npm run lint` | Linter (eslint) |
| `npm test` | Pruebas de politica de acceso y callbacks de NextAuth |
| `npm run test:auth-integration` | Prueba HTTP de produccion en `127.0.0.1:3017` (credenciales ficticias, no llama a Google ni Linear) |
| `npm run fetch-data` | Obtener datos desde Linear API |
| `npm run list-projects` | Listar proyectos disponibles en Linear |

## Seguridad

- El login exige un correo verificado por Google cuyo dominio este en `AUTH_ALLOWED_DOMAINS` (coincidencia exacta, sin subdominios ni sufijos).
- Tanto la pagina como `/api/board` verifican la sesion en el servidor.
- Las sesiones JWT estan cifradas, en cookies HttpOnly, SameSite=Lax y Secure cuando `NEXTAUTH_URL` usa HTTPS (obligatorio en Railway).
- Las respuestas de la API son `private, no-store`; la cache de disco no se sirve como archivo publico.
- Cada acceso exitoso queda registrado (fecha, hora y correo) en `.cache/access-log/access.log`.
- Los datos incluyen titulos, identificadores, etiquetas, hitos y nombres de asignados. Solo deben acceder personas autorizadas para verlos.
- El tablero es de **solo lectura** y la API key de Linear permanece en el servidor.
- La version de la app (`package.json`) se muestra en el login y al pie del tablero.
