# Informe de integración — Gestión de Vuelos y Reservas

> Programación IV · TP Integrador · 16/11/2026
> Base: rama `develop` de `Project-Copy-Paste`.

## 1. Criterio de la integración

- Se respetó el código y la apariencia de `Project-Copy-Paste`. Del prototipo solo se tomaron las piezas que faltaban para que los módulos funcionen juntos.
- No se cambió el contrato de vuelos ni de autenticación, ni el puerto (`5000`), ni la forma en que viajan los enums (números), porque el frontend ya depende de eso.
- No se tocó la base de datos: no hay migraciones nuevas y el modelo coincide con la migración `Inicial` ya aplicada en Supabase (`dotnet ef migrations has-pending-model-changes` → sin cambios).

### Qué NO se trajo del prototipo y por qué

| Del prototipo | Motivo |
|---|---|
| Frontend completo (Navbar, AdminVuelosPage, etc.) | Reemplazaría el diseño de Tomás. Se agregaron solo la reserva de asiento y el panel de vuelos, hechos con los componentes existentes. |
| `JsonStringEnumConverter` | Cambiaría `estado: 0` por `"Confirmada"` y rompería `adapters.js`. |
| Puerto 5080 y perfil https | El repo ya usa 5000 en `launchSettings.json` y `.env.example`. |
| `Email` de pasajero opcional editando la migración `Inicial` | La migración ya está aplicada en Supabase; editarla la desincroniza. Queda como migración incremental pendiente. |
| `UsuarioRepository` y quitar los try/catch de Vuelos/Auth | Son módulos de Agustín y Alex y ya funcionan; el middleware global cubre lo que se escape. |

## 2. Cambios realizados

### Backend (`VuelosApi/`)

| Archivo | Cambio |
|---|---|
| `Dtos/Reserva/CrearReservaDTO.cs` | Recibe `vueloId`, `asientoId` y el pasajero de una de dos formas (exactamente una): `pasajero` anidado (contrato 4.5 / D1, se busca por documento o se crea) o `pasajeroId` de uno existente (compatible con el flujo de `feature/frontend`, que crea el pasajero con `POST /api/pasajeros`). |
| `Dtos/Reserva/PasajeroReservaDTO.cs` (nuevo) | `nombre`, `apellido`, `documento` con validación (obligatorios, largo máximo, documento alfanumérico de 6 a 20). |
| `Dtos/Reserva/ReservaPasajeroDTO.cs` (nuevo) | Pasajero dentro de la respuesta. |
| `Dtos/Reserva/ReservaDTO.cs` | Agrega `pasajero { nombre, apellido, documento }`. Se conservan los campos que ya usaba el frontend. |
| `Repositories/IReservaRepository.cs`, `ReservaRepository.cs` | Buscar/agregar pasajero por DNI. El `catch` de violación de índice único pasó del Service al Repository (el Service ya no usa EF Core ni Npgsql). |
| `Services/ReservaService.cs` | Busca o crea al pasajero, valida que el documento no esté a nombre de otra persona, usa `ConflictoException` para los 409 y documenta cada regla. |
| `Controllers/ReservasController.cs` | Errores en formato ProblemDetails (`detail`), 403 con mensaje, atributos `ProducesResponseType` para Swagger, lee el claim `Id` o `NameIdentifier`. |
| `Repositories/IPasajeroRepository.cs`, `PasajeroRepository.cs` (nuevos) | Repositorio específico de pasajeros. |
| `Services/PasajerosService.cs` | Usa `IPasajeroRepository` en lugar de `Repository<T>` con `Include`/`AnyAsync` en el Service. |
| `Repositories/Repository.cs` (eliminado) | Repositorio genérico que solo usaba `PasajerosService`. |
| `Middleware/ApiExceptionMiddleware.cs` (nuevo) | Manejo global de errores (D11): toda excepción no controlada sale como ProblemDetails (409/404/403/500). |
| `Program.cs` | Registro de `IPasajeroRepository`, middleware global y DI agrupada por módulo. |
| `Services/AuthService.cs` | Una línea: el token también lleva `ClaimTypes.NameIdentifier` (el README de Auth ya lo documenta). |

### Frontend (`frontend/src/`)

| Archivo | Cambio |
|---|---|
> Al integrar con `develop` quedaron las pantallas de Tomás para la reserva (`ReservarPage`, `/dashboard/vuelos/:id/reservar`) y la administración (`AdminVuelosPage` en `/admin`, `AdminReservasPage` en `/admin/reservas`). Las versiones propias de esta rama (`ReservarAsiento`, `VueloForm` y el panel en `AdminHomePage`) se descartaron para no duplicar pantallas.

| Archivo | Cambio |
|---|---|
| `api/reservasApi.js` | `crear` acepta las dos formas del backend: `{ vueloId, asientoId, pasajeroId }` (la que usa `ReservarPage`) o `{ vueloId, asientoId, pasajero }`. |
| `api/adapters.js` | `adaptReserva` lee además el pasajero anidado (documento), el usuario que reservó y los datos del vuelo, que usa el pase de abordar. |
| `components/PaseReserva.jsx` (nuevo) y `components/ReservaRow.jsx` | **"Ver pase"** en Mis reservas: muestra el pase de abordar de cada reserva (reutiliza `BoardingPass`). |
| `components/ConfirmDialog.jsx` | Prop opcional `errorTitle` (antes el título del error decía siempre "No se pudo cancelar la reserva"). El valor por defecto es el de antes. |
| `package-lock.json` (eliminado) / `pnpm-lock.yaml` | El grupo usa **pnpm**, no npm. Queda un solo lockfile (`pnpm-lock.yaml`). Comandos: `pnpm install`, `pnpm dev`, `pnpm lint`, `pnpm build`. También se actualizó la tabla de la sección 2.4 de `ACUERDOS_TECNICOS.md`. |

## 3. Cómo quedan los módulos

### 3.1 Vuelos (Agustín) — sin cambios

- `Vuelo` 1—N `Asiento`. Al crear un vuelo se generan los asientos `01..N`; los primeros `cantidadAsientosEjecutivos` son Ejecutivos.
- `GET /api/vuelos` y `GET /api/vuelos/{id}` públicos; `POST`, `PUT`, `DELETE` solo Administrador.
- La disponibilidad de un asiento se calcula: está libre si no tiene una reserva Confirmada.
- No se puede reducir la capacidad por debajo de las reservas activas ni borrar un vuelo con reservas (409).

### 3.2 Usuarios y seguridad (Alex) — sin cambios de comportamiento

- Registro y login (`/api/auth/registro`, `/api/auth/login`) con BCrypt y JWT (60 min, HMAC-SHA256).
- El registro siempre crea rol `Usuario`; el Administrador se siembra con `AdminSeed:Email` / `AdminSeed:Password` en User Secrets.
- Claims: `Id`, `NameIdentifier`, `Name`, `Email`, `Role`.

### 3.3 Pasajeros y reservas (Ignacio)

Detalle completo en [`VuelosApi/RESERVAS_CAMBIOS.md`](../VuelosApi/RESERVAS_CAMBIOS.md). Resumen:

- `Usuario` 1—N `Reserva`, `Vuelo` 1—N `Reserva`, `Asiento` 1—N `Reserva` (una sola Confirmada), `Pasajero` 1—N `Reserva`.
- Reservar valida vuelo, asiento, disponibilidad y duplicados; crea al pasajero si no existe.
- Cancelar es lógico y libera el asiento.

### 3.4 Frontend (Tomás)

- `/` landing pública, `/login`, `/registro`.
- Con sesión: `/dashboard`, `/dashboard/vuelos`, `/dashboard/vuelos/:id` (detalle con botón "Reservar un asiento"), `/dashboard/vuelos/:id/reservar` (reserva en pasos: asiento → pasajero → resumen → comprobante), `/dashboard/reservas` (mis reservas, "Ver pase" y cancelación; el Administrador ve todas).
- `/admin` y `/admin/reservas` (solo Administrador): administración de vuelos (alta, edición, eliminación) y de reservas.
- Axios con interceptor que agrega `Authorization: Bearer`, y ante un 401 cierra la sesión.

### Flujo de una reserva de punta a punta

1. El usuario abre `/dashboard/vuelos/:id` → **Reservar un asiento** → `/dashboard/vuelos/:id/reservar`. `GET /api/vuelos/{id}` trae los asientos con `disponible`.
2. **Asiento:** elige uno libre en el mapa. **Pasajero:** completa nombre, apellido, DNI, email y teléfono (opcional). El Administrador también puede elegir un pasajero existente.
3. **Resumen → Confirmar:** un solo `POST /api/reservas` con el token y el pasajero anidado (o `pasajeroId` si se eligió uno existente) → `ReservasController` toma el usuario del token → `ReservaService` busca el pasajero por DNI (o lo crea) y aplica las reglas → `ReservaRepository` guarda.
4. 201: **comprobante** con el precio calculado por el servidor. 409: si el asiento se ocupó, vuelve al mapa; si no, muestra el `detail`. 400: vuelve al formulario con el error junto al campo.
5. En `/dashboard/reservas` la reserva aparece como Confirmada, tiene **Ver pase** y se puede cancelar (`DELETE` → 204).

## 4. Cómo ejecutar

Backend (desde `VuelosApi/`, con `ConnectionStrings:Supabase` y `Jwt:Key` en User Secrets):

```powershell
dotnet ef migrations list   # debe mostrar 20261113190441_Inicial sin "(Pending)"
dotnet run                  # http://localhost:5000/swagger
```

Frontend (desde `frontend/`):

```powershell
Copy-Item .env.example .env   # VITE_API_URL=http://localhost:5000/api
pnpm install --frozen-lockfile
pnpm dev                      # http://localhost:5173
```

CORS permite `http://localhost:5173`. Si Vite arranca en otro puerto (por ejemplo porque hay otro proyecto corriendo), hay que agregar ese origen en `Cors:AllowedOrigins`.

## 5. Verificación

| Prueba | Resultado |
|---|---|
| `dotnet build` | OK, 0 warnings, 0 errores |
| Cambios de modelo pendientes de migración | Ninguno |
| `pnpm lint` / `pnpm build` | OK |
| API contra Supabase (script de 25 casos: 201/400/401/403/404/409/204) | 25/25 OK |
| Flujo en el navegador: login → elegir asiento → reservar → Mis reservas → cancelar | OK, sin errores de consola |
| Panel de administración: `pnpm lint` / `pnpm build` | OK |
| CRUD de vuelos por API contra Supabase (script de 20 casos) | 20/20 OK: crear (201), validación (400), sin token (401), Usuario crea/edita/elimina (403), código repetido (409), reducir capacidad quitando un asiento reservado (409), ampliar capacidad (200), eliminar con reservas o con historial (409), eliminar sin reservas (204) |
| Panel de administración en el navegador (cuenta Administrador) | OK: validación de campos vacíos, alta de vuelo, edición (código repetido → mensaje 409; cambio de precio y capacidad → guardado), eliminar vuelo con historial → mensaje 409 en el diálogo, eliminar vuelo sin reservas → eliminado. Las fechas se mantienen en hora local al ida y vuelta |

**Datos de prueba que quedaron en Supabase**:

- Usuarios (rol Usuario): `prueba.reservas.1794841066083@test.local`, `prueba.ajena.1794841066083@test.local`, `prueba.panel.454899@test.local`.
- Usuario **Administrador** de prueba: `admin@prueba.local` (la contraseña está en `admin-prueba.txt`, fuera del repo).
- Pasajeros: "Ana Prueba" (`T41066083`) y "Panel Prueba" (`P45489900`).
- Reservas #2, #3 y #4 del vuelo AR1024, dos del vuelo de prueba `ZZ454899` y una de AR1104 y otra de AR1102 (de la revisión): todas **canceladas**.
- Vuelo `ZZ454899` (estado **Cancelado**), que no se puede borrar porque tiene reservas en su historial.
- Los 15 vuelos de prueba `AR1100`–`AR1128` (sección 6): son datos de demostración a propósito.

## 6. Revisión del programa: correcciones y mejoras

Se revisó el sistema completo. Los errores se confirmaron contra la API antes de corregirlos y las correcciones se probaron después (15/15 casos por API, más el flujo en el navegador).

### Errores corregidos

| # | Error | Corrección | Archivo |
|---|---|---|---|
| 1 | Se podía crear o editar un vuelo **sin fecha de salida o llegada**: se guardaba el año 0001 | Las fechas pasan a ser `DateTime?` con `[Required]` → 400 | `Dtos/Vuelo/VueloEntradaDTO.cs`, `Services/VueloService.cs` |
| 2 | **Precio de 100.000.000 → error 500**: el DTO lo permitía pero la columna es `numeric(10,2)`; con el +50 % ejecutivo también desbordaba | Tope de 10.000.000 → 400 | `VueloEntradaDTO.cs` |
| 3 | Se podían **crear vuelos con salida en el pasado** | Al crear, la salida tiene que ser futura → 400 (al editar se permite, para corregir vuelos viejos) | `Dtos/Vuelo/CrearVueloDTO.cs` |
| 4 | **Cancelar un vuelo dejaba sus reservas Confirmadas** | Al pasar el vuelo a Cancelado se cancelan sus reservas confirmadas y se liberan los asientos | `Services/VueloService.cs` |
| 5 | Se podía **cancelar la reserva de un vuelo que ya salió** | → 409 "No se puede cancelar la reserva de un vuelo que ya salió." | `Services/ReservaService.cs` |
| 6 | **La API se caía al arrancar si la base no respondía** (el seed del admin estaba fuera del `try/catch`) | Se registra el error en el log y la API levanta igual; las peticiones devuelven 500 (ProblemDetails) hasta que vuelva la base | `Program.cs` |

### Mejoras para la presentación

| Mejora | Qué hace | Archivos |
|---|---|---|
| **Más vuelos de prueba** | 15 vuelos entre ciudades argentinas (Córdoba, Mendoza, Bariloche, Salta, Ushuaia, Iguazú, Mar del Plata, Neuquén, Tucumán, Trelew…), con fechas de 1 a 30 días **desde el día en que se cargan**, distintas capacidades, precios y asientos ejecutivos, y uno Cancelado. Se cargan si `DatosDePrueba:Cargar` es `true` (opción que agregó Agustín) y el seed es idempotente: agrega solo los códigos que faltan | `Config/DatosDePrueba.cs`, `Program.cs` |
| **Estado automático del vuelo** | Un vuelo Programado se muestra "En vuelo" entre la salida y la llegada, y "Finalizado" después. Se calcula al responder, no se escribe en la base | `Services/VueloService.cs` |
| **Pase de abordar** | En Mis reservas cada reserva tiene "Ver pase" (pasajero, documento, categoría, precio, vuelo, asiento, salida). Reutiliza el `BoardingPass` de la landing. Al reservar, el comprobante es el `ComprobanteReserva` de Tomás | `components/PaseReserva.jsx` (nuevo), `ReservaRow.jsx`, `api/adapters.js` |

## 7. Integración con `develop` y problemas corregidos

`develop` ya traía el frontend de Tomás (reserva en pasos, `/admin`, `/admin/reservas`, landing nueva) y la opción `DatosDePrueba:Cargar` de Agustín. Al integrarlo con esta rama:

**Conflictos resueltos**

| Archivo | Resultado |
|---|---|
| `VuelosApi/Program.cs` | Middleware de errores, seed del admin que no tira la API y registro de servicios de esta rama + la condición `DatosDePrueba:Cargar` de Agustín |
| `VuelosApi/Config/DatosDePrueba.cs` | Los 15 vuelos idempotentes de esta rama, condicionados por `DatosDePrueba:Cargar` |
| `VuelosApi/README.md` | Versión de Agustín, con el ejemplo de reserva y las reglas actualizadas |
| `frontend/src/api/reservasApi.js` | Una sola función `crear` para `pasajeroId` o pasajero anidado |
| `frontend/src/api/adapters.js` | Se eliminó una función `adaptAsiento` duplicada que impedía compilar |
| `AdminHomePage.jsx`, `VueloDetallePage.jsx` | Quedan las versiones de Tomás; las pantallas propias de esta rama se descartaron |

**Problemas que ya estaban en `develop` y se corrigieron**

| Problema | Corrección | Archivos |
|---|---|---|
| **No se podía reservar para un pasajero ya registrado.** "Pasajero nuevo" con un DNI existente daba 409 en `POST /api/pasajeros`, y "Pasajero existente" daba 403 a un Usuario (la lista es solo para Administrador) | La reserva se crea en un solo pedido con el pasajero anidado: el backend lo busca por DNI y lo reutiliza o lo crea. "Pasajero existente" se muestra solo al Administrador. Se suman `email` y `telefono` opcionales al pasajero de la reserva para no perder esos datos | `pages/ReservarPage.jsx`, `api/reservasApi.js`, `Dtos/Reserva/PasajeroReservaDTO.cs`, `Services/ReservaService.cs` |
| Al pasar del asiento al paso del pasajero, el formulario aparecía con errores de "campo obligatorio" sin haber escrito nada (el mismo `<button>` se reutilizaba y el clic enviaba el formulario) | `key` distinta para el botón de cada paso | `pages/ReservarPage.jsx` |
| **La landing mostraba vuelos y cifras inventados** (`sampleFlights.js`, "Datos de ejemplo"), contra el requisito "sin mocks" | Pase, cifras, tablero de salidas/llegadas y ficha salen de `GET /api/vuelos`, con estados de carga y error. Se eliminó `sampleFlights.js` | `pages/LandingPage.jsx`, `landing/StatsBand.jsx`, `landing/DeparturesBoard.jsx`, `landing/TicketSection.jsx`, `landing/Hero.jsx`, `FlightTicket.jsx` |
| `pnpm lint` fallaba con 5 errores (variables e imports sin usar) | Se quitaron | `FlightTicket.jsx`, `layouts/AuthLayout.jsx` |
| `frontend/README.md` indicaba comandos de npm | Pasan a pnpm | `frontend/README.md` |

**Verificación después de integrar:** `dotnet build` sin warnings, `pnpm lint` sin errores, `pnpm build` OK. Contra Supabase: 25/25 casos de reservas y vuelos, 10/10 de compatibilidad de formatos, 6/6 de reserva repetida para el mismo DNI. En el navegador: landing con datos reales, reserva en pasos como Usuario (incluido un pasajero ya registrado), "Pasajero existente" como Administrador, Ver pase y cancelación.
