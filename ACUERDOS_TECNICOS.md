# Acuerdos técnicos: Gestión de Vuelos y Reservas

> Programación IV · TP Integrador · Repositorio `Project-Copy-Paste` · Archivo: `docs/ACUERDOS_TECNICOS.md`
> **Versión 0.2 (borrador para revisión del grupo)** · 2026-11-07

## Índice

1. [Introducción](#1-introducción)
   - [1.1 Objetivo y alcance](#11-objetivo-y-alcance)
   - [1.2 Cómo interpretar las etiquetas](#12-cómo-interpretar-las-etiquetas)
   - [1.3 Equipo y módulos](#13-equipo-y-módulos)
2. [Tecnologías y estructura del proyecto](#2-tecnologías-y-estructura-del-proyecto)
   - [2.1 Stack general](#21-stack-general)
   - [2.2 Dependencias del frontend](#22-dependencias-del-frontend)
   - [2.3 Estructura del repositorio](#23-estructura-del-repositorio)
   - [2.4 Configuración para ejecutar el proyecto](#24-configuración-para-ejecutar-el-proyecto)
   - [2.5 Reglas compartidas del backend](#25-reglas-compartidas-del-backend)
3. [Trabajo por integrante](#3-trabajo-por-integrante)
   - [3.1 Agustín Cabrera: vuelos y base de datos](#31-agustín-cabrera-vuelos-y-base-de-datos)
   - [3.2 Ignacio Giménez: usuarios y seguridad](#32-ignacio-giménez-usuarios-y-seguridad)
   - [3.3 Alex Ramírez: pasajeros y reservas](#33-alex-ramírez-pasajeros-y-reservas)
   - [3.4 Tomás Coolican: frontend e integración](#34-tomás-coolican-frontend-e-integración)
4. [Contratos de integración](#4-contratos-de-integración)
   - [4.1 Convenciones generales](#41-convenciones-generales)
   - [4.2 Fechas e identificadores](#42-fechas-e-identificadores)
   - [4.3 Códigos HTTP](#43-códigos-http)
   - [4.4 Formato de errores](#44-formato-de-errores)
   - [4.5 Estructuras JSON](#45-estructuras-json)
5. [Git y flujo de trabajo](#5-git-y-flujo-de-trabajo)
   - [5.1 Ramas](#51-ramas)
   - [5.2 Conventional Commits](#52-conventional-commits)
   - [5.3 Pull Requests e integración en develop](#53-pull-requests-e-integración-en-develop)
6. [Criterios de integración y pruebas](#6-criterios-de-integración-y-pruebas)
   - [6.1 Cómo integrar los módulos](#61-cómo-integrar-los-módulos)
   - [6.2 Pruebas mínimas](#62-pruebas-mínimas)
   - [6.3 Un endpoint está terminado cuando](#63-un-endpoint-está-terminado-cuando)
   - [6.4 Checklist de entrega](#64-checklist-de-entrega)
7. [Decisiones pendientes](#7-decisiones-pendientes)

---

## 1. Introducción

### 1.1 Objetivo y alcance

Este documento es la referencia técnica compartida de los cuatro integrantes. Sirve para responder dos preguntas: **qué me toca implementar** y **qué tengo que coordinar con los demás**.

- Cubre: tecnologías, estructura del repo, trabajo de cada integrante, contratos de la API, Git, integración y decisiones pendientes.
- No cubre: especificaciones empresariales ni infraestructura de producción. Es un proyecto académico: se prioriza que funcione, sin sobrearquitecturar.
- `[Confirmado]` Todos los integrantes deben poder explicar las decisiones técnicas en la defensa oral.
- `[Confirmado]` No se agregan dependencias sin justificarlas ante el grupo.

### 1.2 Cómo interpretar las etiquetas

| Etiqueta | Significado |
|---|---|
| `[Confirmado]` | Ya establecido por el grupo o por la consigna. Se cumple sin discusión. |
| `[Propuesto]` | Recomendación lista para discutir. **No es un acuerdo** hasta que el grupo la apruebe. |
| `[Pendiente]` | Falta una definición del equipo. Se marca con ⚠️ y un código (por ejemplo, **D5**) que remite a la [sección 7](#7-decisiones-pendientes). |

Cómo cambiar el estado de algo: se abre un PR que modifique este documento (`docs(acuerdos): ...`), se avisa al grupo y, con la aprobación, la etiqueta pasa a `[Confirmado]`.

### 1.3 Equipo y módulos

| Integrante | Nombre | Responsabilidad | Rama | Sección |
|---|---|---|---|---|
| 1 | Agustín Cabrera | Vuelos y base de datos | `feature/vuelos` | [3.1](#31-agustín-cabrera-vuelos-y-base-de-datos) |
| 2 | Ignacio Giménez | Usuarios y seguridad | `feature/auth` | [3.2](#32-ignacio-giménez-usuarios-y-seguridad) |
| 3 | Alex Ramírez | Pasajeros y reservas | `feature/reservas` | [3.3](#33-alex-ramírez-pasajeros-y-reservas) |
| 4 | Tomás Coolican | Frontend e integración | `feature/frontend` | [3.4](#34-tomás-coolican-frontend-e-integración) |

`[Confirmado]` Este reparto de responsabilidades está acordado.

---

## 2. Tecnologías y estructura del proyecto

### 2.1 Stack general

| Área | Tecnología | Estado | Nota |
|---|---|---|---|
| Frontend | React | `[Confirmado]` | |
| Frontend | JavaScript (no TypeScript) | `[Confirmado]` | |
| Frontend | Tailwind CSS | `[Confirmado]` | Estilos |
| Frontend | React Hook Form | `[Confirmado]` | Formularios y validación |
| Frontend | Axios | `[Confirmado]` | Peticiones HTTP |
| Frontend | Vite | `[Propuesto]` | Herramienta de desarrollo y build |
| Frontend | React Router | `[Propuesto]` | La consigna admite React Router o Wouter |
| Frontend | Context API (solo para la sesión) | `[Propuesto]` | |
| Backend | ASP.NET Core (`VuelosApi`) | `[Confirmado]` | |
| Backend | Entity Framework Core con migraciones | `[Confirmado]` | |
| Backend | JWT para autenticación | `[Confirmado]` | |
| Backend | Swagger y CORS | `[Confirmado]` | Exigidos por la consigna |
| Backend | Proveedor de base de datos | ⚠️ `[Pendiente]` **D13** | |
| Comunicación | API REST con JSON | `[Confirmado]` | |

### 2.2 Dependencias del frontend

| Tipo | Paquetes | Estado |
|---|---|---|
| Confirmadas | `react`, `react-dom`, `tailwindcss` (con su integración para Vite según la guía oficial vigente), `react-hook-form`, `axios` | `[Confirmado]` |
| Propuestas | `react-router`, `vite` (herramienta de desarrollo) | `[Propuesto]` |
| No se usan | TypeScript, librerías de esquemas de validación (Zod, Yup), Zustand, jwt-decode, dayjs y moment | `[Propuesto]` |

Cualquier dependencia nueva se justifica ante el grupo antes de agregarse.

### 2.3 Estructura del repositorio

`[Propuesto]` El frontend se incorpora en una carpeta propia, sin interferir con `VuelosApi/`, que no se renombra.

```
Project-Copy-Paste/
├── VuelosApi/          # backend (ya existe)
├── frontend/           # React + Vite (nuevo)
├── docs/
│   └── ACUERDOS_TECNICOS.md
├── README.md
└── .gitignore
```

El `.gitignore` debe cubrir como mínimo: `node_modules`, `dist`, `.env`, `bin`, `obj`.

### 2.4 Configuración para ejecutar el proyecto

| Qué | Propuesta | Estado | Responsable |
|---|---|---|---|
| Puerto del backend | Fijarlo en `launchSettings.json` | ⚠️ `[Pendiente]` **D12** | Agustín |
| URL del API en el frontend | Variable `VITE_API_URL` en `frontend/.env`, que no se sube. Se deja un `frontend/.env.example` | `[Propuesto]` | Tomás |
| Origen permitido por CORS (desarrollo) | `http://localhost:5173` (puerto por defecto de Vite) | `[Propuesto]` | Agustín |
| Cadena de conexión | `user-secrets` o variable de entorno, sin subirla al repo | `[Propuesto]` | Agustín |
| Clave del JWT | `user-secrets` o variable de entorno, sin subirla al repo | `[Propuesto]` | Ignacio |
| Proveedor de base de datos | Debe poder levantarse en la máquina de los cuatro. Si `VuelosApi` ya lo define, se registra acá | ⚠️ `[Pendiente]` **D13** | Agustín |

`[Propuesto]` Pasos para levantar el proyecto (van también en el README):

| Parte | Pasos |
|---|---|
| Backend | Configurar secretos, aplicar migraciones (`dotnet ef database update`) y ejecutar (`dotnet run`) |
| Frontend | `cd frontend`, `npm install`, crear `.env` a partir de `.env.example` y `npm run dev` |

Cada vez que se integra una migración nueva en `develop`, todos aplican `dotnet ef database update` después de actualizar su rama.

### 2.5 Reglas compartidas del backend

Valen para Agustín, Ignacio y Alex.

**Lo que exige la consigna** `[Confirmado]`:

- Arquitectura en capas: Controller → Service → Repository.
- Inyección de dependencias por constructor.
- DTOs de entrada y salida, con validación.
- EF Core con migraciones.
- Swagger, CORS y manejo de errores.
- Al menos 2 entidades relacionadas (uno-a-muchos) y CRUD completo sobre al menos una.

**Carpetas** `[Propuesto]`: se organiza por capa y cada entidad tiene sus propios archivos, así cada integrante trabaja en archivos distintos.

```
VuelosApi/
├── Controllers/
├── Services/          (interfaces + implementaciones)
├── Repositories/      (interfaces + implementaciones)
├── Models/            (entidades)
├── DTOs/              (subcarpetas Auth, Vuelos, Reservas)
├── Data/              (AppDbContext y configuraciones)
├── Middleware/
├── Migrations/
└── Program.cs
```

**Reglas de capas** `[Propuesto]`:

| Capa | Hace | No hace |
|---|---|---|
| Controller | Recibe y devuelve DTOs, delega en el Service | No usa el `DbContext` ni contiene reglas de negocio |
| Service | Reglas de negocio y validaciones de negocio | No accede directamente a EF Core |
| Repository | Acceso a datos con EF Core | No contiene reglas de negocio |

Las entidades nunca se devuelven en la API: siempre se devuelven DTOs.

**Entidades y relaciones** `[Propuesto]`:

| Relación | Dueño de la entidad |
|---|---|
| `Vuelo` 1—N `Asiento` | Agustín |
| `Usuario` 1—N `Reserva` | Ignacio (Usuario) y Alex (Reserva) |
| `Vuelo` 1—N `Reserva` | Agustín (Vuelo) y Alex (Reserva) |
| `Asiento` 1—N `Reserva` (solo una activa por asiento) | Agustín (Asiento) y Alex (Reserva) |
| `Pasajero` y `Reserva` | Alex. ⚠️ `[Pendiente]` **D1** |

**Archivos que tocan varios integrantes** `[Propuesto]`:

| Archivo | Cómo evitar conflictos |
|---|---|
| `Program.cs` (registro de DI y configuración) | Un bloque comentado por módulo: Vuelos, Auth, Reservas |
| `AppDbContext` | Un solo contexto. Cada integrante agrega sus `DbSet` y configuraciones en líneas separadas |
| `Migrations/` | El dueño de las migraciones es Agustín (ver [3.1](#31-agustín-cabrera-vuelos-y-base-de-datos)). Los demás no generan migraciones por su cuenta |

**Tareas transversales:**

| Tarea | Responsable | Estado |
|---|---|---|
| Swagger y CORS | Agustín | `[Propuesto]` |
| Botón "Authorize" (Bearer) en Swagger | Ignacio | `[Propuesto]` |
| Middleware global de errores | A definir | ⚠️ `[Pendiente]` **D11** |

---

## 3. Trabajo por integrante

Cada subsección tiene el mismo orden: responsabilidades, qué implementar, endpoints, reglas, y qué coordinar con los demás. Los contratos JSON están en la [sección 4](#4-contratos-de-integración) y no se repiten acá.

### 3.1 Agustín Cabrera: vuelos y base de datos

**Responsabilidades** `[Confirmado]`:

- Entidades `Vuelo` y `Asiento` y sus relaciones.
- Configuración de EF Core y migraciones.
- `VueloRepository`, `VueloService` y `VueloController`.
- CRUD de vuelos y Swagger.

**Qué implementar** `[Propuesto]`:

| Capa | Archivos sugeridos |
|---|---|
| Models | `Vuelo`, `Asiento` |
| Data | `AppDbContext` (relaciones y configuración) |
| Repositories | `IVueloRepository`, `VueloRepository` |
| Services | `IVueloService`, `VueloService` |
| Controllers | `VuelosController` |
| DTOs | `DTOs/Vuelos/`: listado, detalle y entrada (ver [4.5](#45-estructuras-json)) |

Campos derivados del contrato `[Propuesto]`:

| Entidad | Campos |
|---|---|
| `Vuelo` | `Id`, `Codigo`, `Origen`, `Destino`, `FechaSalida`, `FechaLlegada`, `Precio` |
| `Asiento` | `Id`, `VueloId`, `Numero` y, según **D5**, un indicador de disponibilidad |

**Endpoints** `[Confirmado]` (los permisos son `[Propuesto]`):

| Endpoint | Acceso | Nota |
|---|---|---|
| `GET /api/vuelos` | Público ⚠️ **D4** | Incluye `asientosDisponibles` |
| `GET /api/vuelos/{id}` | Público ⚠️ **D4** | Incluye la lista de asientos con `disponible` |
| `POST /api/vuelos` | Administrador | Genera los asientos. ⚠️ **D6** |
| `PUT /api/vuelos/{id}` | Administrador | Aplica la regla de capacidad |
| `DELETE /api/vuelos/{id}` | Administrador | ⚠️ **D7** si el vuelo tiene reservas |

**Reglas de negocio:**

- `[Confirmado]` **No se puede reducir la capacidad de un vuelo por debajo de la cantidad de reservas existentes.** Si se intenta, el `PUT` responde `409` con un mensaje claro (ejemplo en [4.4](#44-formato-de-errores)).
- ⚠️ `[Pendiente]` **D6**: cómo se cuentan las "reservas existentes" (todas o solo las activas), y qué asientos se pueden quitar al reducir la capacidad.
- `[Propuesto]` Validaciones del DTO: campos obligatorios, llegada posterior a salida, precio no negativo y capacidad mayor que cero.

**Migraciones** `[Propuesto]`:

1. Agustín es el único que genera migraciones.
2. Si otro integrante necesita un cambio de entidad, se lo pide (por PR o por el grupo). No edita entidades ajenas por su cuenta.
3. Si dos migraciones entran en conflicto, se descartan y se regeneran, no se mezclan a mano.
4. En los primeros días sube un esqueleto real con entidades, `AppDbContext`, primera migración y datos de prueba (vuelos con asientos), para que Tomás trabaje sin mocks.

**Dependencias con otros módulos:**

| Con | Qué | Estado |
|---|---|---|
| Alex | La regla de capacidad necesita contar las reservas de un vuelo. Alex expone esa consulta en su Repository y el `VueloService` la usa | `[Propuesto]` |
| Alex | Disponibilidad de asientos: quién la actualiza al reservar y cancelar | ⚠️ **D5** |
| Alex | Restricción para impedir dos reservas activas sobre el mismo asiento: requiere una migración | `[Propuesto]` |
| Ignacio | `[Authorize(Roles = ...)]` con los roles definidos en [3.2](#32-ignacio-giménez-usuarios-y-seguridad) | `[Confirmado]` |
| Tomás | Puerto del API, origen de CORS, datos de prueba y formato exacto de las fechas con `Z` (ver [4.2](#42-fechas-e-identificadores)) | `[Propuesto]` |

### 3.2 Ignacio Giménez: usuarios y seguridad

**Responsabilidades** `[Confirmado]`:

- Entidad `Usuario`.
- Registro y login.
- JWT.
- Roles Administrador y Usuario, y autorización con `[Authorize]`.
- DTOs y validaciones.
- Hash seguro de contraseñas.

**Qué implementar** `[Propuesto]`:

| Capa | Archivos sugeridos |
|---|---|
| Models | `Usuario` (`Id`, `Nombre`, `Email` único, `PasswordHash`, `Rol`) |
| Repositories | `IUsuarioRepository`, `UsuarioRepository` |
| Services | `IAuthService`, `AuthService` |
| Controllers | `AuthController` |
| DTOs | `DTOs/Auth/`: registro, login y respuesta de autenticación (ver [4.5](#45-estructuras-json)) |
| Program.cs | Bloque de configuración de JWT y de Swagger con Bearer |

**Endpoints** `[Confirmado]`:

| Endpoint | Acceso | Nota |
|---|---|---|
| `POST /api/auth/registro` | Público | El rol asignado es siempre "Usuario". ⚠️ **D8** y **D9** |
| `POST /api/auth/login` | Público | Credenciales inválidas: `401` con mensaje genérico `[Propuesto]` |

**Registro y login** `[Propuesto]`:

- El email es único. Si ya existe, el registro responde `409`.
- La contraseña nunca se guarda en texto plano. El algoritmo de hash lo elige Ignacio.
- Ignacio define las reglas de validación (formato de email, largo mínimo de contraseña, campos obligatorios) y se las pasa a Tomás, para que el DTO y React Hook Form validen lo mismo.

**JWT** `[Propuesto]`:

| Tema | Propuesta |
|---|---|
| Claims | Id del usuario en `NameIdentifier` y rol en el claim de rol estándar |
| Respuesta | Incluye `token`, `expiraEn` y `usuario`, para que el frontend no necesite decodificar el JWT |
| Duración | ⚠️ `[Pendiente]` **D10** |
| Clave | Fuera del repo (ver [2.4](#24-configuración-para-ejecutar-el-proyecto)) |

**Roles y permisos:**

- `[Confirmado]` Los roles son **Administrador** y **Usuario**.
- `[Propuesto]` Los valores se escriben exactamente así, con esas mayúsculas, en el token, en `[Authorize(Roles = ...)]` y en el frontend. Si alguien escribe distinto, la autorización falla sin avisar.
- `[Propuesto]` La seguridad real está en el backend. Ocultar botones en el frontend es solo experiencia de usuario.

Matriz de permisos `[Propuesto]`:

| Acción | Anónimo | Usuario | Administrador |
|---|---|---|---|
| Ver vuelos y detalle | Sí ⚠️ **D4** | Sí | Sí |
| Registrarse e iniciar sesión | Sí | Sí | Sí |
| Crear una reserva | No | Sí | Sí |
| Ver y cancelar sus propias reservas | No | Sí | Sí |
| Ver todas las reservas | No | No ⚠️ **D3** | Sí |
| Crear, editar y eliminar vuelos | No | No | Sí |

**Dependencias con otros módulos:**

| Con | Qué | Estado |
|---|---|---|
| Alex | El id del usuario autenticado sale de los claims del token | `[Propuesto]` |
| Agustín y Alex | Roles consistentes en todos los `[Authorize]` | `[Propuesto]` |
| Tomás | Estructura de la respuesta de autenticación y reglas de validación. Login y registro funcionando lo antes posible, porque el resto depende de ellos | `[Propuesto]` |
| Todos | Creación del administrador (sembrado al iniciar la aplicación) | ⚠️ **D9** |

### 3.3 Alex Ramírez: pasajeros y reservas

**Responsabilidades** `[Confirmado]`:

- Entidades `Pasajero` y `Reserva`, y sus relaciones con vuelos y usuarios.
- Repository, Service y Controller.
- Reservar y cancelar asientos.
- Evitar reservas duplicadas y controlar la disponibilidad.
- DTOs y validaciones.

**Qué implementar** `[Propuesto]`:

| Capa | Archivos sugeridos |
|---|---|
| Models | `Reserva`, `Pasajero` (según **D1**) |
| Repositories | `IReservaRepository`, `ReservaRepository` |
| Services | `IReservaService`, `ReservaService` |
| Controllers | `ReservasController` |
| DTOs | `DTOs/Reservas/`: respuesta y creación (ver [4.5](#45-estructuras-json)) |

**Endpoints** `[Confirmado]` (los permisos son `[Propuesto]`):

| Endpoint | Acceso | Nota |
|---|---|---|
| `GET /api/reservas` | Con sesión | Qué devuelve según el rol: ⚠️ **D3** |
| `GET /api/reservas/{id}` | Dueño de la reserva o Administrador | |
| `POST /api/reservas` | Con sesión | |
| `DELETE /api/reservas/{id}` | Dueño de la reserva o Administrador | Qué hace exactamente: ⚠️ **D2** |

**Reglas de la creación de una reserva** `[Propuesto]`:

1. El usuario sale del token. **El `usuarioId` no viaja en el body.** Si viajara, cualquiera podría reservar a nombre de otro.
2. El vuelo y el asiento deben existir, y el asiento debe pertenecer a ese vuelo.
3. El asiento debe estar disponible. Si no, `409`.
4. Evitar duplicados: un asiento no puede tener dos reservas activas. Se controla en el Service y, para cubrir pedidos simultáneos, con una restricción única en la base de datos (se pide a Agustín por migración). ⚠️ **D1**: define qué otro caso cuenta como duplicado, por ejemplo el mismo pasajero dos veces en un vuelo.
5. Al cancelar, el asiento vuelve a estar disponible. ⚠️ **D2** y **D5**.

**Dependencias con otros módulos:**

| Con | Qué | Estado |
|---|---|---|
| Agustín | Usa `Vuelo` y `Asiento`. Los cambios en esas entidades se piden a Agustín | `[Propuesto]` |
| Agustín | Expone la consulta que cuenta las reservas de un vuelo (para la regla de capacidad) | `[Propuesto]` |
| Agustín | Disponibilidad de asientos | ⚠️ **D5** |
| Agustín | Qué pasa al eliminar un vuelo con reservas | ⚠️ **D7** |
| Ignacio | Lectura del id y el rol desde los claims | `[Propuesto]` |
| Tomás | Estructuras de reserva y creación de reserva. Modelo de pasajero, cancelación y alcance de `GET /api/reservas` | ⚠️ **D1**, **D2**, **D3** |

### 3.4 Tomás Coolican: frontend e integración

**Responsabilidades** `[Confirmado]`:

- React: listado y detalle de vuelos, registro y login, interfaz de reservas y panel de administración.
- Consumo de la API con Axios y manejo de JWT.
- Rutas protegidas, validaciones, y estados de carga y error.
- Integración del frontend con el backend real.

**Tecnologías** `[Confirmado]`: React, JavaScript, Tailwind CSS, React Hook Form y Axios. `[Propuesto]` React Router y Context API.

**Estructura de carpetas** `[Propuesto]`:

```
frontend/src/
├── api/          (instancia de Axios + authApi, vuelosApi, reservasApi)
├── context/      (AuthContext)
├── components/   (genéricos: Navbar, Loading, ErrorMessage)
├── pages/        (+ pages/admin/)
├── routes/       (ProtectedRoute, AdminRoute)
├── utils/        (formato de fechas y moneda)
├── App.jsx
└── main.jsx
```

**Reglas de implementación** `[Propuesto]`:

| Tema | Regla |
|---|---|
| Llamadas HTTP | Salen solo de `src/api/` con una única instancia de Axios. Los componentes no usan Axios directamente |
| Formularios | React Hook Form. Las reglas de validación replican las del backend (ver [3.2](#32-ignacio-giménez-usuarios-y-seguridad)). Los errores `400` del servidor se muestran junto a cada campo |
| Estados de UI | Cada pantalla que usa la API muestra tres estados: cargando, error y con datos |
| Listados | Cada elemento lleva `key` con su `id` |
| Errores del servidor | Se muestra el `detail` de la respuesta (ver [4.4](#44-formato-de-errores)) |
| Fechas e importes | Se formatean con funciones de `utils/` (ver [4.2](#42-fechas-e-identificadores)) |

**Autenticación desde el frontend:**

| Tema | Propuesta | Estado |
|---|---|---|
| Almacenamiento del token y del usuario | `localStorage`, para sobrevivir al refresh. Es simple, y el riesgo es XSS. Las cookies httpOnly exigirían cambios de backend y CORS que no justifican su costo | ⚠️ `[Pendiente]` **D10** |
| Envío del token | Interceptor de request de Axios agrega `Authorization: Bearer <token>` | `[Propuesto]` |
| Sesión vencida | Interceptor de response: ante un `401` limpia la sesión y redirige a `/login` | `[Propuesto]` |
| Identificar al usuario | Se usan `usuario` y `expiraEn` de la respuesta de autenticación. No se decodifica el JWT | `[Propuesto]` |
| Restaurar la sesión | `AuthContext` la restaura desde `localStorage` al recargar | `[Propuesto]` |

**Rutas protegidas** `[Propuesto]`: `ProtectedRoute` exige sesión y `AdminRoute` exige el rol Administrador. Es solo experiencia de usuario: la seguridad real la aplican los `[Authorize]` del backend.

**Pantallas** `[Propuesto]`:

| Ruta | Pantalla | Acceso | Endpoints que usa | Depende de |
|---|---|---|---|---|
| `/` | Listado de vuelos | Público ⚠️ **D4** | `GET /api/vuelos` | Agustín |
| `/vuelos/:id` | Detalle y selección de asiento | Público. Reservar exige sesión | `GET /api/vuelos/{id}`, `POST /api/reservas` | Agustín, Alex |
| `/login` | Login | Público | `POST /api/auth/login` | Ignacio |
| `/registro` | Registro | Público | `POST /api/auth/registro` | Ignacio |
| `/mis-reservas` | Mis reservas | Con sesión | `GET /api/reservas`, `DELETE /api/reservas/{id}` | Alex |
| `/admin/vuelos` | Panel: CRUD de vuelos | Administrador | `POST`, `PUT` y `DELETE /api/vuelos` | Agustín |
| `/admin/reservas` | Panel: todas las reservas | Administrador | `GET /api/reservas` | Alex. ⚠️ **D3** |

**Panel de administración** `[Propuesto]`: en el formulario de vuelos, las fechas se ingresan en hora local y se convierten a UTC antes de enviarlas. Si el backend responde `409` por la regla de capacidad, se muestra el `detail`.

**Rol de integración** `[Propuesto]`: Tomás desarrolla contra el backend real desde el principio, hace la prueba de integración periódica (ver [6.1](#61-cómo-integrar-los-módulos)) y avisa al grupo cuando algo no respeta el contrato.

**Dependencias con el backend:**

| Con | Qué necesita | Estado |
|---|---|---|
| Agustín | Esqueleto con datos de prueba, puerto del API, origen de CORS y fechas con `Z` | `[Propuesto]`, ⚠️ **D12** |
| Ignacio | Login y registro funcionando, estructura de la respuesta de autenticación y reglas de validación | `[Propuesto]`, ⚠️ **D8** |
| Alex | Reservas, modelo de pasajero, cancelación y alcance del listado | ⚠️ **D1**, **D2**, **D3** |
| Agustín y Alex | Cómo se muestran los asientos y cómo se numeran | ⚠️ **D5**, **D6** |

---

## 4. Contratos de integración

Esta es la referencia para comunicarse entre módulos.

`[Confirmado]` Los **endpoints** son los de las secciones 3.1 a 3.3. Las convenciones y estructuras JSON de esta sección son `[Propuesto]` hasta que el grupo las apruebe, salvo lo indicado, y **ninguna está implementada todavía**.

`[Propuesto]` Regla de cambio: un cambio de contrato se hace primero por PR a este documento, con aviso al grupo, y recién después se toca el código.

### 4.1 Convenciones generales

| Tema | Convención | Estado |
|---|---|---|
| Nombres de propiedades | `camelCase` en español (`fechaSalida`, `asientoId`). ASP.NET serializa en camelCase por defecto. En C# se usa PascalCase | `[Propuesto]` |
| Forma de las respuestas | El DTO directo, sin envoltorio `{ data: ... }` | `[Propuesto]` |
| Listas | Arrays simples, sin paginación por ahora | `[Propuesto]` |
| Dinero | Número decimal sin símbolo (`125000.50`) y sin campo de moneda | `[Propuesto]` |
| Idioma de los mensajes | Español, redactados para mostrarse tal cual al usuario | `[Propuesto]` |
| Token | Header `Authorization: Bearer <token>` | `[Propuesto]` |

### 4.2 Fechas e identificadores

**Identificadores** `[Propuesto]`: enteros (`int`), que es el valor por defecto de EF. No hace falta Guid.

**Fechas** `[Confirmado]`: se trabaja siempre en **UTC** y se convierte solo al mostrar.

| Dónde | Qué se hace |
|---|---|
| Base de datos y backend (almacenamiento interno) | Todas las fechas en UTC |
| API (lo que viaja) | ISO 8601 con sufijo `Z`. Ejemplo: `"2026-12-01T14:30:00Z"` |
| Frontend (presentación) | Se convierte a la hora local del navegador con `Intl.DateTimeFormat` en `utils/`, sin librerías de fechas |
| Frontend (envío desde formularios) | Se ingresa en hora local y se convierte a UTC antes de enviar |
| Alcance | No se modelan husos horarios de aeropuertos. La hora mostrada es la de la zona del dispositivo del usuario |

**Atención, Agustín:** hay que verificar que las fechas lleguen al frontend **con la `Z`**. Si llegan sin ella, el navegador las interpreta como locales y el horario se corre.

### 4.3 Códigos HTTP

`[Propuesto]`

| Situación | Código |
|---|---|
| `POST` exitoso | `201` con el objeto creado |
| `PUT` exitoso | `200` con el objeto actualizado |
| `DELETE` exitoso | `204` |
| Datos inválidos (validación) | `400` |
| Sin token o token inválido | `401` |
| Sin permiso para el rol o para el recurso | `403` |
| No existe | `404` |
| Conflicto de negocio (por ejemplo asiento ocupado o capacidad insuficiente) | `409` |

### 4.4 Formato de errores

`[Propuesto]` Se usa el formato estándar `ProblemDetails` de ASP.NET Core, sin inventar un formato propio. Los errores de validación (`400`) y los conflictos de negocio (`409`) se distinguen así: **`errors` aparece solo en el `400`** y **`detail` lo llevan los errores de negocio**.

**Error de validación (`400`)**: un mapa de errores por campo.

```json
{
  "status": 400,
  "title": "Datos inválidos",
  "errors": {
    "email": ["El email no es válido."],
    "password": ["La contraseña es obligatoria."]
  }
}
```

Hay que verificar cómo quedan las claves de `errors` (mayúsculas o minúsculas) y normalizarlas para que el frontend las asocie a cada campo.

**Conflicto de negocio (`409`)**: un mensaje en `detail`, sin `errors`.

```json
{
  "status": 409,
  "title": "Conflicto",
  "detail": "No se puede reducir la capacidad a 10 asientos: el vuelo tiene 12 reservas."
}
```

Otros ejemplos de `detail` en un `409`: "El asiento 12A ya está reservado." o "El email ya está registrado."

**Qué hace el frontend:**

| Código | Qué se muestra |
|---|---|
| `400` | Cada mensaje de `errors` junto a su campo |
| `401` | Se cierra la sesión y se redirige a `/login` |
| `403` | Mensaje de falta de permisos |
| `404` | Mensaje de recurso no encontrado |
| `409` | El `detail` tal cual |
| `5xx` | Mensaje genérico de error |

### 4.5 Estructuras JSON

Todas son `[Propuesto]`. Quién produce y quién consume cada una:

| Estructura | Produce | Consume | Endpoint |
|---|---|---|---|
| Vuelo (listado) | Agustín | Tomás | `GET /api/vuelos` |
| Detalle de vuelo | Agustín | Tomás | `GET /api/vuelos/{id}` |
| Vuelo (entrada) | Tomás | Agustín | `POST` y `PUT /api/vuelos` |
| Registro y login | Tomás | Ignacio | `POST /api/auth/registro`, `POST /api/auth/login` |
| Respuesta de autenticación | Ignacio | Tomás | Las mismas dos rutas ⚠️ **D8** |
| Reserva | Alex | Tomás | `GET` y `POST /api/reservas` |
| Crear reserva | Tomás | Alex | `POST /api/reservas` ⚠️ **D1** |

**Vuelo (listado)**

```json
{
  "id": 1,
  "codigo": "AR1234",
  "origen": "Buenos Aires",
  "destino": "Córdoba",
  "fechaSalida": "2026-12-01T14:30:00Z",
  "fechaLlegada": "2026-12-01T16:00:00Z",
  "precio": 125000.50,
  "asientosDisponibles": 40
}
```

**Detalle de vuelo** (los campos anteriores más lo siguiente)

```json
{
  "asientosTotales": 60,
  "asientos": [
    { "id": 101, "numero": "12A", "disponible": true }
  ]
}
```

El contrato expone `disponible`. Cómo se calcula internamente lo deciden Agustín y Alex (**D5**). El formato de `numero` está en **D6**.

**Vuelo (entrada para crear y editar, solo Administrador)**

```json
{
  "codigo": "AR1234",
  "origen": "Buenos Aires",
  "destino": "Córdoba",
  "fechaSalida": "2026-12-01T14:30:00Z",
  "fechaLlegada": "2026-12-01T16:00:00Z",
  "precio": 125000.50,
  "cantidadAsientos": 60
}
```

> **Cambio respecto de la v0.1:** `cantidadAsientos` ahora también se acepta en el `PUT` (antes solo en el `POST`). Es necesario para poder aplicar la regla de capacidad confirmada en [3.1](#31-agustín-cabrera-vuelos-y-base-de-datos). La forma exacta está en **D6**.

**Registro**

```json
{ "nombre": "Ana", "email": "ana@mail.com", "password": "..." }
```

No incluye el rol: siempre se crea como "Usuario".

**Login**

```json
{ "email": "ana@mail.com", "password": "..." }
```

**Respuesta de autenticación**

```json
{
  "token": "eyJ...",
  "expiraEn": "2026-11-08T17:00:00Z",
  "usuario": { "id": 3, "nombre": "Ana", "email": "ana@mail.com", "rol": "Usuario" }
}
```

**Reserva (respuesta)**

```json
{
  "id": 7,
  "estado": "Confirmada",
  "fechaReserva": "2026-11-07T20:00:00Z",
  "vuelo": { "id": 1, "codigo": "AR1234", "origen": "Buenos Aires", "destino": "Córdoba", "fechaSalida": "2026-12-01T14:30:00Z" },
  "asiento": { "id": 101, "numero": "12A" },
  "pasajero": { "nombre": "Ana", "apellido": "Pérez", "documento": "30123456" }
}
```

**Crear reserva**

```json
{
  "vueloId": 1,
  "asientoId": 101,
  "pasajero": { "nombre": "Ana", "apellido": "Pérez", "documento": "30123456" }
}
```

El `usuarioId` no viaja: el backend lo toma del token.

---

## 5. Git y flujo de trabajo

### 5.1 Ramas

| Rama | Propósito | Responsable | Estado |
|---|---|---|---|
| `main` | Versión estable. **No se trabaja directamente sobre `main`** | Todos | `[Confirmado]` |
| `develop` | Rama de integración | Todos | `[Confirmado]` |
| `feature/vuelos` | Vuelos y base de datos (reemplaza a `feature/backend`) | Agustín | `[Confirmado]` |
| `feature/auth` | Autenticación y seguridad | Ignacio | `[Confirmado]` |
| `feature/reservas` | Pasajeros y reservas | Alex | `[Confirmado]` |
| `feature/frontend` | Frontend e integración | Tomás | `[Confirmado]` |

- `[Confirmado]` Se mantienen las ramas por módulo. No es obligatorio crear una rama corta por cada funcionalidad: queda a criterio de cada integrante.
- `[Confirmado]` `feature/backend` se renombra a `feature/vuelos`. Conviene hacerlo antes de abrir PRs desde esa rama.
- `[Propuesto]` Cada integrante trae `develop` a su rama con frecuencia, al menos cada 2 o 3 días y antes de abrir un PR, para evitar conflictos grandes.
- `[Propuesto]` `main` y `develop` se protegen: solo aceptan cambios por PR, con al menos 1 aprobación de otro integrante. Revisar código ajeno ayuda a que todos puedan explicar el proyecto.
- `[Propuesto]` `main` se actualiza solo en hitos: una versión que funciona de punta a punta, y la entrega.

### 5.2 Conventional Commits

`[Confirmado]` Se usan Conventional Commits: `tipo(alcance): descripción`.

| Elemento | Valores | Estado |
|---|---|---|
| Tipos | `feat`, `fix`, `docs`, `refactor`, `chore`, `test` | `[Confirmado]` |
| Alcances | `vuelos`, `auth`, `reservas`, `front` | `[Propuesto]` |
| Idioma de la descripción | Español, en imperativo | ⚠️ `[Pendiente]` **D15** |

Ejemplos: `feat(auth): agregar login con JWT` · `fix(reservas): validar asiento ocupado` · `docs(acuerdos): definir formato de errores`.

### 5.3 Pull Requests e integración en develop

- `[Confirmado]` Las funcionalidades se integran con **Pull Requests hacia `develop`**.
- `[Propuesto]` El título del PR sigue el mismo formato que los commits.
- `[Propuesto]` La descripción del PR incluye tres puntos: qué cambia, cómo probarlo y si **modifica un contrato** (sí o no). Si lo modifica, se avisa al grupo. Se puede dejar una plantilla en `.github/`.
- `[Propuesto]` Otro integrante revisa y aprueba antes del merge.
- ⚠️ `[Pendiente]` **D14**: forma de merge. La propuesta es "Create a merge commit" y no squash, porque la consigna evalúa los commits de todos los integrantes y el squash borra ese detalle.

---

## 6. Criterios de integración y pruebas

### 6.1 Cómo integrar los módulos

`[Propuesto]`

1. **Contrato primero.** Este documento es la referencia. Los cambios de contrato pasan por PR a este archivo antes de tocar código.
2. **Esqueleto real al comienzo**, para que el frontend no dependa de mocks:
   - Agustín sube primero entidades, `AppDbContext`, la primera migración y datos de prueba de vuelos, con endpoints que ya devuelvan el JSON acordado.
   - Ignacio sube login y registro funcionando lo antes posible.
   - Tomás desarrolla contra el backend real desde el principio.
3. **Swagger como fuente de verdad.** Un endpoint no está terminado si no aparece en Swagger con el DTO correcto.
4. **Frecuencia.** Cada 2 o 3 días se prueba `develop` con el frontend corriendo contra el backend de `develop`. Un PR se considera integrado solo si esa prueba pasa.
5. **Cambios en entidades.** Los hace el dueño del módulo. Si afectan la base de datos, pasan por Agustín (dueño de migraciones).

### 6.2 Pruebas mínimas

`[Propuesto]` Las pruebas son manuales, con Swagger y el frontend. Los tests automatizados son opcionales según la consigna. Antes de cada integración se verifica:

| Área | Qué se prueba |
|---|---|
| Autenticación | Registro y login correctos e incorrectos |
| Seguridad | Acceso sin token (`401`) y con rol incorrecto (`403`) |
| Reservas | Reservar un asiento libre, intentar reservar uno ocupado (`409`) y cancelar una reserva |
| Vuelos | CRUD completo desde el panel de administración |
| Regla de capacidad | Intentar reducir la capacidad por debajo de las reservas existentes (`409`) |
| Frontend | Estados de carga y de error visibles, y sesión vencida que redirige a `/login` |

### 6.3 Un endpoint está terminado cuando

`[Propuesto]`

- Respeta el contrato de la [sección 4](#4-contratos-de-integración): propiedades, códigos HTTP y formato de errores.
- Usa DTOs de entrada y salida con validación.
- Está documentado en Swagger y protegido con `[Authorize]` cuando corresponde.
- Funciona contra la base de datos real con las migraciones aplicadas.
- El frontend lo puede consumir sin cambios en el contrato.

### 6.4 Checklist de entrega

`[Confirmado]` Rúbrica de la consigna. Para aprobar deben cumplirse todos los mínimos:

- [ ] Backend por capas: Controller, Service y Repository, con DI por constructor.
- [ ] EF Core con migraciones y al menos 2 entidades relacionadas.
- [ ] Registro y login con JWT, roles y endpoints protegidos.
- [ ] Endpoints funcionales, documentados con Swagger y con CORS configurado.
- [ ] Frontend React que consume la API: rutas, formularios validados, listado con `key`, carga y error.
- [ ] El frontend opera contra el backend real, **sin mocks**.
- [ ] Repositorio con commits de todo el grupo.
- [ ] Defensa oral: la app funciona y todos explican su parte.

La entrega es única, al finalizar el cuatrimestre, por mensaje al grupo de WhatsApp con integrantes (nombre y apellido), link del repositorio y link del deploy si lo hay. El deploy es opcional y suma como bonus.

---

## 7. Decisiones pendientes

> [!WARNING]
> Estas cuestiones **no están aprobadas**. Las propuestas son recomendaciones, no acuerdos. Cuando el grupo decida, se actualiza la etiqueta en las secciones correspondientes.

| ID | Tema | Opciones | Propuesta recomendada | Participan |
|---|---|---|---|---|
| **D1** | Modelo de pasajero y qué es una reserva duplicada | Dentro de `POST /api/reservas`, o con endpoints propios | Dentro de la reserva: una reserva equivale a un asiento y un pasajero. Duplicada = mismo asiento con dos reservas activas, y Alex define si el mismo pasajero repetido en un vuelo también cuenta | Alex, Tomás |
| **D2** | Qué hace `DELETE /api/reservas/{id}` | Cancelación lógica (`estado: "Cancelada"`) o borrado físico | Lógica: queda historial y se libera el asiento | Alex, Tomás |
| **D3** | Qué devuelve `GET /api/reservas` según el rol | Todos ven solo las suyas, o el Administrador ve todas | El Usuario ve las suyas y el Administrador ve todas | Alex, Ignacio, Tomás |
| **D4** | Vuelos públicos | `GET /api/vuelos` y `GET /api/vuelos/{id}` anónimos o con sesión | Anónimos | Agustín, Ignacio, Tomás |
| **D5** | Disponibilidad de asientos | Campo de estado en `Asiento` o derivada de las reservas activas. Quién la actualiza | El contrato expone `disponible`. Agustín y Alex deciden la implementación | Agustín, Alex |
| **D6** | Capacidad y numeración de asientos | `cantidadAsientos` en `POST` y `PUT`. Cómo se agregan y quitan asientos. Si las "reservas existentes" son todas o solo las activas. Formato de `numero` (por ejemplo `12A`) | `cantidadAsientos` en `POST` y `PUT`. Se cuentan solo las reservas activas. Nunca se quita un asiento reservado: si reducir la capacidad obligaría a hacerlo, responde `409`. La numeración la define Agustín y se la comunica a Tomás | Agustín, Tomás |
| **D7** | Eliminar un vuelo que tiene reservas | Rechazar, o eliminar en cascada | Rechazar con `409` | Agustín, Alex, Tomás |
| **D8** | Respuesta de `POST /api/auth/registro` | Igual a la del login, o solo confirmación | Igual a la del login, para quedar logueado sin otra petición | Ignacio, Tomás |
| **D9** | Creación del administrador | Administrador sembrado, o rol elegible en el registro | Sembrado al iniciar la aplicación. El registro siempre crea "Usuario" | Ignacio |
| **D10** | Token: almacenamiento y duración | `localStorage` u otra opción. Duración del token | `localStorage`, de 1 a 2 horas, sin refresh token | Ignacio, Tomás |
| **D11** | Quién hace el middleware global de errores | Alguno de los tres del backend | A definir entre los tres. Alex o quien tenga menos carga | Agustín, Ignacio, Alex |
| **D12** | Puerto del backend y valor de `VITE_API_URL` | Valores concretos | Agustín lo fija en `launchSettings.json` y avisa a Tomás | Agustín, Tomás |
| **D13** | Proveedor de base de datos | SQL Server, SQLite u otro | Cualquiera que los cuatro puedan levantar localmente. Lo decide Agustín | Agustín, todos |
| **D14** | Forma de merge de los PR | Merge commit o squash | Merge commit, para conservar los commits de cada integrante | Todos |
| **D15** | Idioma de la descripción de los commits | Español o inglés | Español, en imperativo | Todos |
