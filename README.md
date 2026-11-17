# Project-Copy-Paste

API de vuelos y reservas (ASP.NET Core 9, Entity Framework Core y PostgreSQL en Supabase) con frontend en React.

## Puesta en marcha de la API

### Requisitos

- .NET 9 SDK
- Acceso a la base PostgreSQL del grupo (Supabase). Pedir la cadena de conexión a quien administra el proyecto.
- Herramienta de migraciones: `dotnet tool install --global dotnet-ef --version 9.0.0`

### 1. Configurar los secretos

La API no arranca sin secretos y ninguno se guarda en Git. Desde la carpeta `VuelosApi`:

```powershell
dotnet user-secrets init
dotnet user-secrets set "Jwt:Key" "una-clave-de-al-menos-32-caracteres"
dotnet user-secrets set "ConnectionStrings:Supabase" "Host=aws-0-us-west-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.<id-del-proyecto>;Password=<contraseña>;SSL Mode=Require;Trust Server Certificate=true"
```

`Jwt:Key` tiene que medir 32 bytes o más. Para generar una:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
```

La cadena de conexión va en formato clave=valor (Npgsql no acepta el formato `postgresql://`). Con el pooler de Supabase el usuario es `postgres.<id-del-proyecto>`.

### 2. Administrador inicial (opcional)

Si querés un usuario administrador, configurá estos dos valores. Se crea una sola vez si el email no existe.

```powershell
dotnet user-secrets set "AdminSeed:Email" "admin@vuelos.local"
dotnet user-secrets set "AdminSeed:Password" "una-clave-de-12-o-mas-caracteres"
```

### 3. Vuelos de ejemplo (opcional)

Para cargar 15 vuelos de ejemplo con sus asientos (rutas argentinas, con fechas de 1 a 30 días desde el día de carga):

```powershell
dotnet user-secrets set "DatosDePrueba:Cargar" "true"
```

Se agregan solo los vuelos cuyo código todavía no existe, así que no duplica nada aunque la tabla ya tenga vuelos.

### 4. Base de datos

El repositorio ya incluye la migración `Inicial`. Desde `VuelosApi`:

```powershell
dotnet ef database update
```

Si la base del grupo ya tiene las tablas, no hace falta correrlo. En caso de duda, consultar al equipo antes de aplicar migraciones sobre una base compartida.

### 5. Ejecutar

```powershell
dotnet restore
dotnet run
```

La API queda en `http://localhost:5000` y Swagger en `http://localhost:5000/swagger`. Para probar endpoints protegidos, hacer login en `/api/auth/login`, copiar el `token` y pegarlo en el botón Authorize.

### Problemas comunes

- `Configurá Jwt:Key...`: falta el secreto `Jwt:Key` o mide menos de 32 bytes.
- `password authentication failed`: la contraseña o el usuario de la cadena de conexión no coinciden con los de Supabase.
- Las carpetas `bin/` y `obj/` no se versionan. Si git las muestra como modificadas, hay que sacarlas del índice con `git rm -r --cached VuelosApi/obj`.

## Endpoints de autenticación

### Registro

`POST /api/auth/registro`

```json
{
  "nombre": "Alex",
  "email": "alex@ejemplo.com",
  "password": "UnaClaveSegura123!"
}
```

El rol siempre se asigna en el servidor como `Usuario`. El DTO no acepta rol ni hash.

### Login

`POST /api/auth/login`

```json
{
  "email": "alex@ejemplo.com",
  "password": "UnaClaveSegura123!"
}
```

La respuesta incluye `token`, `expiraEn` y los datos públicos del usuario. No devuelve `PasswordHash`.

## Claims del JWT

- `Id`: identificador numérico del usuario, leído por `ReservasController`.
- `ClaimTypes.NameIdentifier`: el mismo identificador como compatibilidad.
- `ClaimTypes.Role`: `Usuario` o `Administrador`.
- `ClaimTypes.Name` y `ClaimTypes.Email`.

El token dura 60 minutos por defecto. Firma HMAC-SHA256, validación de firma, emisor, audiencia y expiración habilitadas. El margen de reloj es de 30 segundos.

## Swagger

En Swagger, ejecutá `/api/auth/login`, copiá el valor de `token` de la respuesta y pulsá **Authorize**. Pegá solamente el token; Swagger agrega `Bearer` automáticamente.

## Integración

Rutas propuestas para acordar con el equipo: `/api/auth/registro` y `/api/auth/login`. Los nombres de roles son exactamente `Administrador` y `Usuario`.

## Deploy

Backend en Render (Docker, `VuelosApi/Dockerfile`) y frontend en Vercel: paso a paso en [docs/DEPLOY.md](docs/DEPLOY.md).
