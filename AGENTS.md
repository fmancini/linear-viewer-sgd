<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Verificacion y autenticacion

- `npm test`: pruebas de politica de acceso y callbacks de NextAuth.
- `npm run build && npm run test:auth-integration`: prueba HTTP de produccion en 127.0.0.1:3017. Usa credenciales ficticias y un secreto efimero; no llama a Google ni Linear. Mantener ese puerto libre.
- `npm run lint`: actualmente detecta errores previos de react-hooks/set-state-in-effect en ThemeProvider y useBoardData; no desactivar reglas para ocultarlos.
- Configuracion obligatoria: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET (aleatorio, minimo 32 caracteres), NEXTAUTH_URL y AUTH_ALLOWED_DOMAINS. Ver env.example; nunca leer o publicar valores de .env.
- El acceso se permite a cualquier correo verificado por Google cuyo dominio (exacto, sin subdominios ni sufijos) figure en AUTH_ALLOWED_DOMAINS (lista separada por comas, ej. asimov.cl,digital.gob.cl). No reemplazarla por una validacion solo en el cliente.
- Cada inicio de sesion exitoso se registra en `.cache/access-log/access.log` (una linea JSON por acceso, con timestamp ISO y correo) via src/lib/access-log.ts.
- `/data/*` esta bloqueado por src/proxy.ts para impedir acceso a archivos legacy. Cache real: `.cache/linear/`, fuera de public; mantener autorizacion en la pagina y API aunque se cambie el proxy.
- El entorno local ignora package-lock.json mediante un gitignore global; no modificar esa configuracion global.
