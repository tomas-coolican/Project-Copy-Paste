# VuelosApi - Sistema de gestión de vuelos

API REST en ASP.NET Core 9, C#, Entity Framework Core y PostgreSQL (Supabase). La estructura sigue el patrón del ejemplo Panadería: Controllers, DTOs, Models, Repositories, Services, Config y Enums.

La configuración (secretos, base de datos, administrador y vuelos de ejemplo) está explicada paso a paso en el [README de la raíz](../README.md).

## Endpoints principales

### Vuelos

- `GET /api/vuelos` - listar vuelos (incluye `asientosTotales` y `asientosDisponibles`). Público.
- `GET /api/vuelos/{id}` - detalle del vuelo con la lista de asientos y su disponibilidad. Público.
- `POST /api/vuelos` - crear vuelo y generar sus asientos. Solo `Administrador`.
- `PUT /api/vuelos/{id}` - modificar el vuelo (mismo cuerpo que el POST; `cantidadAsientos` aplica la regla de capacidad). Solo `Administrador`.
- `DELETE /api/vuelos/{id}` - eliminar solo si no tiene reservas asociadas (incluidas las canceladas, para conservar el historial). Responde `204`. Solo `Administrador`.

Ejemplo para crear o editar un vuelo:

```json
{
  "codigo": "AR100",
  "origen": "Buenos Aires",
  "destino": "Cordoba",
  "fechaSalida": "2027-03-10T08:00:00Z",
  "fechaLlegada": "2027-03-10T09:30:00Z",
  "precio": 85000,
  "cantidadAsientos": 30
}
```

Opcionales: `cantidadAsientosEjecutivos` (solo POST) y `estado` (solo PUT, valor numérico del enum).

Reglas de capacidad en el `PUT`: al subir se agregan asientos continuando la numeración; al bajar se quitan los últimos, y si alguno tiene reservas o hay más reservas activas que la nueva capacidad, responde `409`.

Los errores `404` y `409` se devuelven en formato ProblemDetails (`title` y `detail`); los `400` de validación traen `errors` por campo.

### Pasajeros

- `GET /api/pasajeros` - listar. Solo `Administrador`.
- `GET /api/pasajeros/{id}` - detalle. Solo `Administrador`.
- `POST /api/pasajeros` - crear. Solo `Administrador` (un usuario común carga el pasajero dentro de la reserva).
- `DELETE /api/pasajeros/{id}` - eliminar solo si no tiene reservas asociadas. Solo `Administrador`.

Ejemplo:

```json
{
  "nombre": "Ana",
  "apellido": "Gomez",
  "dni": "30111222",
  "email": "ana@mail.com",
  "telefono": "3415555555"
}
```

### Reservas

- `GET /api/reservas`
- `GET /api/reservas/{id}`
- `POST /api/reservas`
- `DELETE /api/reservas/{id}` - cancelar una reserva propia (o cualquiera si el usuario es Administrador).

El pasajero se indica de una de dos formas (exactamente una). Con sus datos: se busca por documento y, si no existe, se crea con la reserva.

```json
{
  "vueloId": 1,
  "asientoId": 1,
  "pasajero": { "nombre": "Ana", "apellido": "Gomez", "documento": "30111222", "email": "ana@mail.com" }
}
```

`email` y `telefono` son opcionales y se guardan solo si el pasajero es nuevo.

O, solo un `Administrador`, con un pasajero ya existente (un usuario común que manda `pasajeroId` recibe 403):

```json
{
  "pasajeroId": 1,
  "vueloId": 1,
  "asientoId": 1
}
```

Detalle de las reglas del módulo en [RESERVAS_CAMBIOS.md](RESERVAS_CAMBIOS.md).

## Qué hace la lógica de negocio

- Al crear un vuelo se generan automáticamente los asientos.
- Los primeros asientos indicados se crean como Ejecutivos; el resto como Turista.
- Una reserva solo se confirma si existen el pasajero, el vuelo y el asiento, y queda asociada al usuario autenticado mediante `UsuarioId`.
- No se reservan vuelos cancelados, finalizados o que ya salieron.
- Un asiento no puede tener dos reservas confirmadas. Un pasajero tampoco puede tener dos reservas confirmadas para el mismo vuelo.
- La categoría Ejecutiva cuesta un 50% más que el precio base.
- Cancelar una reserva libera el asiento para una nueva reserva. No se puede cancelar la reserva de un vuelo que ya salió.
- Cancelar un vuelo (estado Cancelado) cancela sus reservas confirmadas.
- El estado se muestra automático según el horario: "En vuelo" entre la salida y la llegada, "Finalizado" después.
- No se elimina un pasajero ni un vuelo que tengan reservas asociadas (aunque estén canceladas): las reservas históricas se conservan y sus claves foráneas usan `DeleteBehavior.Restrict`.

## Capas

- **Models:** entidades que representan las tablas.
- **Dtos:** datos que recibe y devuelve la API. Evitan exponer directamente las entidades.
- **Controllers:** reciben las peticiones HTTP y devuelven respuestas.
- **Services:** contienen las reglas del negocio.
- **Repositories:** centralizan las operaciones de acceso a datos.
- **Config/AppDbContext:** configura Entity Framework y las relaciones de la base de datos.
- **Enums:** estados y categorías con valores definidos.

## Alcance de esta versión

Incluye vuelos, pasajeros, asientos y reservas.
