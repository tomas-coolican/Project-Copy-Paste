# VuelosApi - Sistema de gestión de vuelos

API REST en ASP.NET Core 9, C#, Entity Framework Core y SQL Server. La estructura sigue el patrón utilizado en el ejemplo Panadería: Controllers, DTOs, Models, Repositories, Services, Config y Enums.

## Requisitos
- Visual Studio 2022 actualizado o .NET 9 SDK.
- SQL Server Express o SQL Server Developer.
- SQL Server Management Studio (opcional).

## 1. Configurar SQL Server
Abrir `appsettings.json` y revisar `ConexionSqlServer`.

Para SQL Server Express normalmente se utiliza:
`Server=localhost\SQLEXPRESS;Database=VuelosUTN;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true`

Para una instancia local predeterminada:
`Server=localhost;Database=VuelosUTN;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true`

## 2. Restaurar paquetes y crear la base
Desde una terminal ubicada en la carpeta del proyecto:

```bash
dotnet restore
dotnet tool install --global dotnet-ef
dotnet ef migrations add CrearBaseVuelos
dotnet ef database update
dotnet run
```

Si ya tenés instalado `dotnet-ef`, no hace falta ejecutar la segunda línea.

## 3. Abrir Swagger
Al ejecutar el proyecto, abrir la dirección HTTPS que informa la consola y agregar `/swagger`.

## Endpoints principales

### Vuelos
- `GET /api/vuelos` - listar vuelos.
- `GET /api/vuelos/{id}` - obtener un vuelo.
- `POST /api/vuelos` - crear vuelo y generar sus asientos.
- `PUT /api/vuelos/{id}` - modificar datos y estado.
- `DELETE /api/vuelos/{id}` - eliminar si no tiene reservas confirmadas.

Ejemplo para crear vuelo:
```json
{
  "numeroVuelo": "AR100",
  "origen": "Buenos Aires",
  "destino": "Cordoba",
  "fechaSalida": "2027-03-10T08:00:00",
  "fechaLlegada": "2027-03-10T09:30:00",
  "capacidad": 30,
  "precioBase": 85000,
  "cantidadAsientosEjecutivos": 5
}
```

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
- **Config/AppDbContext:** configura Entity Framework y las relaciones de SQL Server.
- **Enums:** estados y categorías con valores definidos.

## Alcance de esta primera versión
Incluye vuelos, pasajeros, asientos y reservas. La integración meteorológica Open-Meteo del proyecto anterior se puede incorporar como servicio independiente en una segunda etapa, sin mezclarla con las reglas de reservas.
