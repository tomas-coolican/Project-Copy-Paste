# Project-Copy-Paste

## Configuración local de autenticación

La API usa JWT y BCrypt. La clave JWT y la contraseña del administrador inicial **no se guardan en appsettings.json ni en Git**.

Desde la carpeta `VuelosApi`:

```powershell
dotnet user-secrets init
dotnet user-secrets set "Jwt:Key" ([Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(64)))
dotnet user-secrets set "Jwt:Issuer" "VuelosApi"
dotnet user-secrets set "Jwt:Audience" "VuelosApi"
dotnet user-secrets set "Jwt:DuracionMinutos" "60"
```

Para crear el administrador inicial, configurá también (con una contraseña propia, larga y única):

```powershell
dotnet user-secrets set "AdminSeed:Email" "admin@vuelos.local"
dotnet user-secrets set "AdminSeed:Password" "CAMBIAR_POR_UNA_CLAVE_SEGURA_DE_12_O_MAS_CARACTERES"
```

El administrador se crea una sola vez si ese email todavía no existe. Si no se configuran `AdminSeed:Email` y `AdminSeed:Password`, no se crea ningún administrador automáticamente.

## Base de datos

Este repositorio no traía migraciones de Entity Framework. Antes de ejecutar la API, desde `VuelosApi` generá la migración:

```powershell
dotnet ef migrations add AgregarUsuariosYAutenticacion
dotnet ef database update
```

**Importante:** si la base `VuelosUTN` ya existe y tiene tablas/datos creados por otro mecanismo, no ejecutes `database update` sin revisar primero con el equipo y hacer una copia de seguridad. La migración inicial puede intentar crear tablas que ya existen. La migración debe aplicarse una sola vez sobre la base acordada.

Si no tenés instalada la herramienta EF:

```powershell
dotnet tool install --global dotnet-ef --version 9.0.0
```

Luego restaurá y ejecutá:

```powershell
dotnet restore
dotnet run
```

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
