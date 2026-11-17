# Módulo de pasajeros y reservas — estado de implementación

Actualizado el 16/11/2026 al integrar el módulo con Vuelos, Auth y el frontend.

## 1. Archivos del módulo

| Capa | Archivo | Qué hace |
|---|---|---|
| Models | `Models/Pasajero.cs` | Nombre, apellido, DNI (único), email, teléfono y navegación a sus reservas. |
| Models | `Models/Reserva.cs` | Fecha, estado, precio pagado y FKs a `Usuario`, `Pasajero`, `Vuelo` y `Asiento`. |
| DTOs (entrada) | `Dtos/Reserva/CrearReservaDTO.cs` | `vueloId`, `asientoId` y el pasajero: `pasajero` anidado (contrato 4.5) o `pasajeroId` (exactamente uno). |
| DTOs (entrada) | `Dtos/Reserva/PasajeroReservaDTO.cs` | `nombre`, `apellido`, `documento` (obligatorios) y `email`, `telefono` (opcionales), con validaciones. |
| DTOs (salida) | `Dtos/Reserva/ReservaDTO.cs` | Reserva con `vuelo`, `asiento` y `pasajero` anidados. |
| DTOs (salida) | `Dtos/Reserva/ReservaVueloDTO.cs`, `ReservaAsientoDTO.cs`, `ReservaPasajeroDTO.cs` | Partes anidadas de la respuesta. |
| Repository | `Repositories/IReservaRepository.cs` / `ReservaRepository.cs` | Consultas EF Core de reservas, y búsqueda/alta de pasajero por DNI. |
| Repository | `Repositories/IPasajeroRepository.cs` / `PasajeroRepository.cs` | Acceso a datos de pasajeros (reemplaza al repositorio genérico `Repository<T>`). |
| Service | `Services/IReservaService.cs` / `ReservaService.cs` | Reglas de negocio. No usa EF Core. |
| Service | `Services/PasajerosService.cs` | Alta, consulta y baja de pasajeros. |
| Controller | `Controllers/ReservasController.cs` | `GET`, `GET {id}`, `POST`, `DELETE` con `[Authorize]`. |
| Controller | `Controllers/PasajerosController.cs` | CRUD administrativo de pasajeros (sin cambios). |
| Middleware | `Middleware/ApiExceptionMiddleware.cs` | Manejo global de errores (D11) en formato ProblemDetails. |

## 2. Endpoints

| Método | Ruta | Acceso | Respuestas |
|---|---|---|---|
| GET | `/api/reservas` | Con sesión | 200. Usuario: sus reservas. Administrador: todas (D3). |
| GET | `/api/reservas/{id}` | Dueño o Administrador | 200, 403, 404 |
| POST | `/api/reservas` | Con sesión | 201, 400, 401, 404, 409 |
| DELETE | `/api/reservas/{id}` | Dueño o Administrador | 204, 403, 404, 409 |

### Crear reserva

```json
{
  "vueloId": 1,
  "asientoId": 101,
  "pasajero": {
    "nombre": "Ana",
    "apellido": "Pérez",
    "documento": "30123456",
    "email": "ana@mail.com",
    "telefono": "3415555555"
  }
}
```

`email` y `telefono` son opcionales y se guardan solo si el pasajero es nuevo. Es el formato que usa la pantalla de reserva (`ReservarPage`): así se puede volver a reservar para alguien que ya viajó, porque el backend lo reutiliza por documento.

El `usuarioId` **no** viaja: se toma del claim `Id` del token (o `NameIdentifier` como respaldo).

También se acepta un pasajero ya existente por id, **solo para el Administrador** (lo usa con "Pasajero existente", que lista `GET /api/pasajeros`). Si un Usuario común manda `pasajeroId` → 403: así nadie puede reservar a nombre de un pasajero que no cargó ni ver sus datos probando ids.

```json
{ "vueloId": 1, "asientoId": 101, "pasajeroId": 5 }
```

Hay que mandar **exactamente uno** de los dos (`pasajero` o `pasajeroId`); si faltan ambos o vienen los dos → 400. Un `pasajeroId` inexistente → 404. Las reglas de duplicado valen igual en los dos casos.

### Respuesta

```json
{
  "id": 7,
  "fechaReserva": "2026-11-16T14:57:51Z",
  "estado": 0,
  "precioPagado": 85000,
  "pasajeroId": 3,
  "nombrePasajero": "Ana Pérez",
  "usuarioId": 10,
  "usuarioNombre": "Ana",
  "vuelo": { "id": 1, "codigo": "AR1024", "origen": "Buenos Aires", "destino": "Córdoba", "fechaSalida": "...Z", "fechaLlegada": "...Z" },
  "asiento": { "id": 12, "numero": "02", "categoria": 0 },
  "pasajero": { "nombre": "Ana", "apellido": "Pérez", "documento": "30123456" }
}
```

`estado`: 0 = Confirmada, 1 = Cancelada. `categoria`: 0 = Turista, 1 = Ejecutivo. Los campos planos (`pasajeroId`, `nombrePasajero`, `usuarioId`, `usuarioNombre`) se mantienen porque el frontend ya los usa.

## 3. Reglas de negocio (en `ReservaService`)

1. El usuario sale del JWT, nunca del body.
2. El vuelo debe existir (404), estar **Programado** (409) y no haber salido (409).
3. El asiento debe existir y pertenecer a ese vuelo (404).
4. **Sin disponibilidad:** si el asiento ya tiene una reserva Confirmada → 409 "El asiento 02 ya está reservado."
5. **Pasajero (D1):** se busca por documento. Si no existe se crea junto con la reserva; si existe se reutiliza. El nombre y el apellido se comparan sin tener en cuenta mayúsculas, tildes ni espacios de más ("Ána Pérez" = "ana perez"). Si no coinciden → 409 con un mensaje genérico ("No pudimos validar los datos del pasajero…"), que **no revela** a nombre de quién está el documento.
6. **Duplicados:** un pasajero no puede tener dos reservas Confirmadas en el mismo vuelo → 409.
7. Precio: el del vuelo; los asientos Ejecutivos tienen un recargo del 50 %.
8. **Concurrencia:** dos pedidos simultáneos por el mismo asiento los frena el índice único filtrado de PostgreSQL (`"Estado" = 0`); el repositorio traduce la violación a 409.
9. **Cancelar (D2):** cancelación lógica. La reserva pasa a `Cancelada`, queda como historial y el asiento vuelve a estar disponible (D5: la disponibilidad se deriva de que no haya reserva Confirmada). Cancelar dos veces → 409. Tampoco se puede cancelar la reserva de un vuelo que ya salió → 409. Si el Administrador cancela el vuelo, sus reservas confirmadas se cancelan solas.
10. Un Usuario solo ve y cancela sus reservas (403 si es ajena); el Administrador puede todas.
11. No se elimina un pasajero que tenga reservas (aunque estén canceladas).
12. **Privacidad de pasajeros:** `/api/pasajeros` (listar, ver, crear, eliminar) es solo para Administrador, porque tiene datos personales. Un Usuario común carga el pasajero dentro de la reserva.

## 4. Errores

Todas las respuestas de error del módulo son `ProblemDetails`: el frontend muestra el `detail`. Los 400 de validación los genera `[ApiController]` con el mapa `errors` (por ejemplo `"Pasajero.Documento"`).

## 5. Pendiente para coordinar

- **Agustín (migraciones):** `Pasajero.Email` es obligatorio en la base, pero el contrato de reservas no pide email. Por ahora los pasajeros creados desde una reserva se guardan con email vacío. Si el grupo quiere que sea opcional, hace falta una migración incremental (`AlterColumn` a nullable). No se modificó la migración `Inicial` porque ya está aplicada en Supabase.

## 6. Pruebas realizadas (16/11/2026, en Supabase)

25/25 verificaciones de API correctas: registro, 401 sin token, 400 por documento inválido, 404 por asiento inexistente, 201 al reservar, 409 por asiento ocupado, por pasajero duplicado y por documento con otro nombre, disponibilidad actualizada, cada usuario ve solo sus reservas, 403 sobre reserva ajena, 403 al crear vuelo sin ser admin, 204 al cancelar, 409 al cancelar dos veces, historial conservado, asiento liberado y re-reservable. Además se probó el flujo completo desde el frontend (elegir asiento → reservar → ver en Mis reservas → cancelar).
