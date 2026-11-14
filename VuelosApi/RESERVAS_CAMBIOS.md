# Módulo de pasajeros y reservas — estado de implementación

Este documento describe el estado de la rama de Ignacio sobre `VuelosApi` y los puntos que necesitan coordinación con los demás integrantes.

## 1. Archivos del módulo

### Entidades y contexto
- `Models/Pasajero.cs`: datos personales del pasajero y navegación a sus reservas.
- `Models/Reserva.cs`: fecha, estado, precio y relaciones con Usuario, Pasajero, Vuelo y Asiento.
- `Models/Usuario.cs`: esqueleto de integración con `Id` y colección de reservas. Alex debe completar esta misma clase, no crear otra entidad `Usuario`.
- `Config/AppDbContext.cs`: `DbSet` y configuración de claves foráneas, restricciones de borrado e índices.

### DTOs
- `Dtos/Reserva/CrearReservaDTO.cs`: se conserva el contrato que ya tenía `VuelosApi`: `PasajeroId`, `VueloId` y `AsientoId`.
- `Dtos/Reserva/ReservaDTO.cs`: mantiene el formato de respuesta existente.

El `UsuarioId` no se incluye en el DTO. El backend lo toma del claim del token JWT para evitar que el cliente elija a nombre de quién reservar.

### Repository
- `Repositories/IReservaRepository.cs`: define las operaciones específicas de lectura y persistencia para reservas.
- `Repositories/ReservaRepository.cs`: implementa esas operaciones con EF Core.

### Service
- `Services/IReservaService.cs`: contrato de las operaciones disponibles para el Controller.
- `Services/ReservaService.cs`: contiene las reglas de negocio y transforma las entidades a DTOs.

### Controller
- `Controllers/ReservasController.cs`: expone GET, GET por id, POST y DELETE. Aplica `[Authorize]`, identifica al usuario desde los claims y traduce los resultados del Service a códigos HTTP.

### Registro de dependencias
- `Program.cs`: registra `IReservaRepository`/`ReservaRepository` y `IReservaService`/`ReservaService`.

## 2. Reglas implementadas

1. El usuario que crea la reserva se obtiene del JWT (`Id` numérico; como alternativa se admite un `NameIdentifier` numérico).
2. El pasajero, el vuelo y el asiento deben existir.
3. El asiento debe pertenecer al vuelo informado.
4. Solo se reservan vuelos programados cuya salida sea futura. Se asume que las fechas se almacenan en UTC.
5. Un asiento no puede tener dos reservas confirmadas.
6. Un pasajero no puede tener dos reservas confirmadas para el mismo vuelo.
7. El precio se obtiene del vuelo; la categoría Ejecutivo conserva el recargo del 50 % que ya tenía el proyecto.
8. Un usuario consulta y cancela sus propias reservas. El rol `Administrador` puede consultar y cancelar cualquiera.
9. La cancelación es lógica: cambia `Estado` a `Cancelada` y conserva el registro.
10. La disponibilidad se deduce de la existencia de una reserva `Confirmada`; no se duplica un campo de disponibilidad en `Asiento`.
11. Los índices únicos filtrados de SQL Server protegen las reglas de asiento y pasajero-vuelo también ante solicitudes simultáneas.
12. No se permite eliminar un pasajero si tiene cualquier reserva asociada, incluso cancelada, porque el historial se conserva y la FK usa `DeleteBehavior.Restrict`.

## 3. Contrato de creación conservado

`POST /api/reservas` recibe:

```json
{
  "pasajeroId": 1,
  "vueloId": 1,
  "asientoId": 1
}
```

No recibe `usuarioId`. El usuario se identifica mediante el JWT.

Importante para el frontend: con este DTO, primero debe existir el pasajero (por ejemplo, creado mediante `POST /api/pasajeros`) y luego se envía su `pasajeroId` al crear la reserva.

## 4. Endpoints del módulo

| Método | Ruta | Comportamiento |
|---|---|---|
| GET | `/api/reservas` | Usuario: sus reservas. Administrador: todas. |
| GET | `/api/reservas/{id}` | Detalle si pertenece al usuario o si es administrador. |
| POST | `/api/reservas` | Crea una reserva para el usuario autenticado. |
| DELETE | `/api/reservas/{id}` | Cancela una reserva propia o cualquiera si es administrador. |

Respuestas principales: 200, 201, 204, 400, 401, 403, 404 y 409 según el caso.

## 5. Integración pendiente con Alex (autenticación)

- Completar `Models/Usuario.cs` con los campos reales de usuario, email/nombre, hash de contraseña y rol que defina Alex, conservando `Id` como `int` y `List<Reserva> Reservas` como navegación.
- El JWT debe contener un claim `Id` con el ID numérico del usuario. El Controller admite `ClaimTypes.NameIdentifier` solo si contiene un entero.
- El rol debe emitirse como claim de rol estándar (`ClaimTypes.Role`) con el valor exacto `Administrador` para que `User.IsInRole("Administrador")` funcione.
- Alex debe configurar `AddAuthentication().AddJwtBearer(...)`, `AddAuthorization()`, `UseAuthentication()` y `UseAuthorization()`.
- Alex debe revisar la duración y validación de JWT, y nunca almacenar contraseñas en texto plano.

Hasta integrar estos puntos, `[Authorize]` está colocado en el Controller, pero el proyecto todavía no tiene autenticación funcional.

## 6. Integración pendiente con Agustín (datos y migraciones)

- Mantener `UsuarioId` como FK requerida de `Reserva` hacia `Usuario` y completar la misma entidad `Usuario`, sin duplicarla.
- Generar la migración cuando estén integrados los modelos definitivos de Usuario, Vuelo, Asiento, Pasajero y Reserva.
- Revisar los índices únicos filtrados de SQL Server: `[Estado] = 0` corresponde a `EstadoReserva.Confirmada`.
- Si la base ya tiene reservas, resolver cómo asignar un `UsuarioId` válido antes de convertir la columna en requerida.
- Revisar `VuelosService.EliminarAsync`: actualmente impide eliminar vuelos con reservas confirmadas, pero la FK restrictiva también impide eliminar vuelos con reservas canceladas. Para conservar el historial, debe impedirse borrar un vuelo con cualquier reserva asociada y devolver 409.
- Confirmar que `FechaSalida` se recibe y almacena en UTC, ya que `ReservaService` compara contra `DateTime.UtcNow`.

Agustín es el responsable de generar y coordinar las migraciones compartidas.

## 7. Integración pendiente con Tomás (frontend)

- Enviar `pasajeroId`, `vueloId` y `asientoId` en `POST /api/reservas`.
- No enviar `usuarioId`.
- Crear/seleccionar primero un pasajero porque el DTO actual recibe un `PasajeroId` ya existente.
- Enviar `Authorization: Bearer <token>` en las cuatro operaciones protegidas.
- Manejar 401 (sesión ausente/vencida), 403 (sin permiso), 404 (no encontrado) y 409 (asiento ocupado o reserva duplicada).
- Mostrar el estado de la reserva y actualizar la disponibilidad al cancelar.

## 8. Estado de compilación y pruebas

Se revisó el código de forma estática y se ajustaron las relaciones y los comportamientos descritos. En este entorno no está instalado el SDK de .NET (`dotnet` no está disponible), por lo que no se pudo ejecutar `dotnet build`, generar migraciones ni probar los endpoints. Esas verificaciones deben realizarse en el entorno de desarrollo del grupo después de integrar la entidad Usuario y la configuración JWT.
