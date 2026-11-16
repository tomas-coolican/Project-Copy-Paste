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
| `api/reservasApi.js` | Nuevo `crear({ vueloId, asientoId, pasajero })`. |
| `api/adapters.js` | `adaptVuelo` conserva los `asientos` del detalle (`id`, `numero`, `categoria`, `disponible`); `adaptReserva` lee el pasajero anidado. |
| `components/ReservarAsiento.jsx` (nuevo) | Mapa de asientos por categoría (libre / elegido / ocupado), formulario de pasajero con React Hook Form, precio con recargo ejecutivo, mensajes de éxito y error. Usa `FormField`, `Button`, `Alert` y `ErrorMessage` existentes. |
| `pages/VueloDetallePage.jsx` | Reemplaza el aviso "La selección de asientos todavía no está disponible" por `<ReservarAsiento>`. Nada más de la página cambió. |
| `pages/AdminHomePage.jsx` | Era un marcador ("La administración se habilita en el próximo tramo"). Ahora es el **panel de administración de vuelos**: listado ordenado por salida, alta, edición y eliminación con confirmación. |
| `components/VueloForm.jsx` (nuevo) | Formulario de alta/edición con React Hook Form y las mismas reglas que `VueloEntradaDTO`. Fechas en hora local → se envían en UTC. Alta: asientos ejecutivos opcionales. Edición: estado del vuelo. |
| `components/ConfirmDialog.jsx` | Prop opcional `errorTitle` (antes el título del error decía siempre "No se pudo cancelar la reserva"). El valor por defecto es el de antes, así que Mis reservas no cambia. |
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
- Con sesión: `/dashboard`, `/dashboard/vuelos`, `/dashboard/vuelos/:id` (**ahora con reserva de asiento**), `/dashboard/reservas` (mis reservas y cancelación; el Administrador ve todas).
- `/admin` (solo Administrador, pestaña "Administración"): **panel de vuelos**. "Nuevo vuelo" abre el formulario → `POST /api/vuelos`; "Editar" → `PUT /api/vuelos/{id}`; "Eliminar" pide confirmación → `DELETE /api/vuelos/{id}`. Los 409 del backend (código repetido, capacidad menor que las reservas, vuelo con reservas) se muestran con su `detail`; los 400 junto a cada campo.
- Axios con interceptor que agrega `Authorization: Bearer`, y ante un 401 cierra la sesión.

### Flujo de una reserva de punta a punta

1. El usuario abre `/dashboard/vuelos/:id` → `GET /api/vuelos/{id}` trae los asientos con `disponible`.
2. Elige un asiento libre y completa nombre, apellido y documento (validados en el navegador con las mismas reglas que el DTO).
3. `POST /api/reservas` con el token → `ReservasController` toma el usuario del token → `ReservaService` aplica las reglas → `ReservaRepository` guarda.
4. 201: se muestra "Reserva confirmada" y se recarga el vuelo (el asiento pasa a ocupado). 409: se muestra el `detail` y se recarga la disponibilidad. 400: el error aparece junto al campo.
5. En `/dashboard/reservas` la reserva aparece como Confirmada y se puede cancelar (`DELETE` → 204).

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
| 2 | **Precio de 100.000.000 → error 500**: el DTO lo permitía pero la columna es `numeric(10,2)`; con el +50 % ejecutivo también desbordaba | Tope de 10.000.000 en el DTO y en el formulario → 400 | `VueloEntradaDTO.cs`, `frontend/src/components/VueloForm.jsx` |
| 3 | Se podían **crear vuelos con salida en el pasado** | Al crear, la salida tiene que ser futura → 400 (al editar se permite, para corregir vuelos viejos) | `Dtos/Vuelo/CrearVueloDTO.cs`, `VueloForm.jsx` |
| 4 | **Cancelar un vuelo dejaba sus reservas Confirmadas** | Al pasar el vuelo a Cancelado se cancelan sus reservas confirmadas y se liberan los asientos | `Services/VueloService.cs` |
| 5 | Se podía **cancelar la reserva de un vuelo que ya salió** | → 409 "No se puede cancelar la reserva de un vuelo que ya salió." | `Services/ReservaService.cs` |
| 6 | **La API se caía al arrancar si la base no respondía** (el seed del admin estaba fuera del `try/catch`) | Se registra el error en el log y la API levanta igual; las peticiones devuelven 500 (ProblemDetails) hasta que vuelva la base | `Program.cs` |

### Mejoras para la presentación

| Mejora | Qué hace | Archivos |
|---|---|---|
| **Más vuelos de prueba** | 15 vuelos entre ciudades argentinas (Córdoba, Mendoza, Bariloche, Salta, Ushuaia, Iguazú, Mar del Plata, Neuquén, Tucumán, Trelew…), con fechas de 1 a 30 días **desde el día en que se cargan**, distintas capacidades, precios y asientos ejecutivos, y uno Cancelado. El seed ahora es idempotente: agrega solo los códigos que faltan, así que se puede correr en cada arranque sin duplicar | `Config/DatosDePrueba.cs`, `Program.cs` |
| **Estado automático del vuelo** | Un vuelo Programado se muestra "En vuelo" entre la salida y la llegada, y "Finalizado" después. Se calcula al responder, no se escribe en la base | `Services/VueloService.cs` |
| **Pase de abordar** | Al confirmar una reserva aparece el pase (pasajero, documento, categoría, precio, vuelo, asiento, salida). En Mis reservas cada reserva tiene "Ver pase". Reutiliza el `BoardingPass` de la landing | `components/PaseReserva.jsx` (nuevo), `ReservarAsiento.jsx`, `ReservaRow.jsx`, `api/adapters.js` |
| **Pasajeros por vuelo** (panel de administración) | Botón "Pasajeros (n)" en cada vuelo: lista de asientos con pasajero, documento, qué usuario reservó y estado. Usa `GET /api/reservas` (al Administrador le devuelve todas); al guardar o eliminar se recargan vuelos y reservas | `pages/AdminHomePage.jsx` |
