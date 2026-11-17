# Vuelos — Frontend

Aplicación web (React 19 + Vite + Tailwind 4, JavaScript) del sistema de gestión de vuelos: landing pública y dashboard con vuelos, reservas, selección de asientos y administración. La identidad visual está en `docs/DESIGN.md`.

## Requisitos

- Node.js 20 o superior
- La API (`VuelosApi`, .NET) funcionando en `http://localhost:5000`

## Cómo levantar todo

1. **Backend.** Seguí el `README.md` de la raíz: secretos (`Jwt:Key`, `ConnectionStrings:Supabase`, y opcionalmente `AdminSeed:Email` / `AdminSeed:Password` para crear un administrador), migración y luego, desde `VuelosApi`:

   ```powershell
   dotnet run
   ```

   La API permite por defecto el origen `http://localhost:5173` (CORS).

2. **Frontend.** Desde `frontend`:

   ```powershell
   Copy-Item .env.example .env
   pnpm install
   pnpm dev
   ```

   Abrí `http://localhost:5173`. El puerto es fijo: si está ocupado, Vite no arranca.

## Variables de entorno

| Variable | Valor por defecto | Uso |
| -------- | ----------------- | --- |
| `VITE_API_URL` | `http://localhost:5000/api` | URL base de la API. Es obligatoria: sin ella la app no inicia. |

## Scripts

| Comando | Qué hace |
| ------- | -------- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm lint` | ESLint |
| `pnpm build` | Build de producción en `dist/` |
| `pnpm test` | Tests con Vitest + Testing Library (`src/**/*.test.js(x)`) |
| `pnpm test:watch` | Tests en modo watch |
| `pnpm preview` | Sirve el build local |

## Estructura

- `src/api/`: único lugar donde se usa Axios (`client.js`, adaptadores y un módulo por recurso).
- `src/components/`, `src/layouts/`, `src/pages/`, `src/routes/`: interfaz, rutas y pantallas.
- `src/context/` y `src/hooks/`: sesión (`AuthContext`, `useAuth`) y carga de datos (`useAsync`).
- `src/index.css`: tokens de diseño en `@theme`; los estilos usan solo esos tokens.

## Cosas a tener en cuenta

- La sesión dura 60 minutos (no hay renovación): al vencer se cierra y se vuelve al login.
- `ProtectedRoute` y `AdminRoute` solo ocultan pantallas. La seguridad real la aplica el backend.
- El precio de un asiento Ejecutivo lo calcula el servidor; antes de confirmar se muestra el precio base.
