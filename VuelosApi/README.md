# VuelosApi - Sistema de gestión de vuelos

API REST en ASP.NET Core 9, C#, Entity Framework Core y PostgreSQL (Supabase). La estructura sigue el patrón utilizado en el ejemplo Panadería: Controllers, DTOs, Models, Repositories, Services, Config y Enums.

## Requisitos
- .NET 9 SDK (o Visual Studio 2022 actualizado).
- Acceso a la base de datos del grupo en Supabase (PostgreSQL). No hace falta instalar nada de base de datos en tu máquina.

## 1. Configurar la conexión a Supabase
`appsettings.json` trae la conexión con la contraseña como `[YOUR-PASSWORD]`. La contraseña real **no se sube al repo**: cada integrante carga la cadena completa en su máquina con user-secrets, desde la carpeta `VuelosApi`:

```bash
dotnet user-secrets set "ConnectionStrings:ConexionBaseDatos" "Host=aws-1-us-west-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.<ref>;Password=<contraseña>;SSL Mode=Require;Trust Server Certificate=true"
```

Los datos salen de Supabase: **Connect → Direct → Session pooler**. Agustín le pasa la contraseña al grupo por un canal privado.

Alternativa: definir la variable de entorno `ConnectionStrings__ConexionBaseDatos`.

## 2. Restaurar paquetes y aplicar migraciones
Desde una terminal ubicada en la carpeta del proyecto:

```bash
dotnet restore
dotnet tool install --global dotnet-ef
dotnet ef database update
dotnet run
```

Si ya tenés instalado `dotnet-ef`, no hace falta ejecutar la segunda línea. Como la base es compartida, las migraciones las genera y aplica solo Agustín; el resto solo corre `dotnet run`.

## 3. Abrir Swagger
Al ejecutar el proyecto, abrir la dirección HTTPS que informa la consola y agregar `/swagger`.

## Endpoints principales

### Vuelos
- `GET /api/vuelos` - listar vuelos (incluye `asientosDisponibles`).
- `GET /api/vuelos/{id}` - detalle del vuelo con la lista de asientos y su disponibilidad.
- `POST /api/vuelos` - crear vuelo y generar sus asientos.
- `PUT /api/vuelos/{id}` - modificar el vuelo (mismo cuerpo que el POST; `cantidadAsientos` aplica la regla de capacidad).
- `DELETE /api/vuelos/{id}` - eliminar si no tiene reservas (responde `204`).

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
Opcionales: `cantidadAsientosEjecutivos` (solo POST) y `estado` (solo PUT).

Reglas de capacidad en el `PUT`: al subir se agregan asientos continuando la numeración; al bajar se quitan los últimos, y si alguno tiene reservas o hay más reservas activas que la nueva capacidad, responde `409`.

### Pasajeros
- `GET /api/pasajeros`
- `GET /api/pasajeros/{id}`
- `POST /api/pasajeros`
- `DELETE /api/pasajeros/{id}`

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
- `PUT /api/reservas/{id}/cancelar`

Ejemplo:
```json
{
  "pasajeroId": 1,
  "vueloId": 1,
  "asientoId": 1
}
```

## Qué hace la lógica de negocio
- Al crear un vuelo se generan automáticamente los asientos.
- Los primeros asientos indicados se crean como Ejecutivos; el resto como Turista.
- Una reserva solo se confirma si existen el pasajero, el vuelo y el asiento.
- No se reservan vuelos cancelados, finalizados o que ya salieron.
- Un asiento no puede tener dos reservas confirmadas.
- La categoría Ejecutiva cuesta un 50% más que el precio base.
- Cancelar una reserva libera el asiento para una nueva reserva.
- No se elimina un vuelo ni un pasajero que tenga reservas confirmadas.

## Capas
- **Models:** entidades que representan las tablas.
- **Dtos:** datos que recibe y devuelve la API. Evitan exponer directamente las entidades.
- **Controllers:** reciben las peticiones HTTP y devuelven respuestas.
- **Services:** contienen las reglas del negocio.
- **Repositories:** centralizan las operaciones de acceso a datos.
- **Config/AppDbContext:** configura Entity Framework y las relaciones de la base de datos.
- **Enums:** estados y categorías con valores definidos.

## Alcance de esta primera versión
Incluye vuelos, pasajeros, asientos y reservas. La integración meteorológica Open-Meteo del proyecto anterior se puede incorporar como servicio independiente en una segunda etapa, sin mezclarla con las reglas de reservas.
