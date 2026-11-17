using VuelosApi.Enums;
using VuelosApi.Models;

namespace VuelosApi.Config;

// Vuelos de ejemplo con sus asientos, para que el frontend trabaje sin mocks.
// Se cargan solo si DatosDePrueba:Cargar es true (ver Program.cs). Es idempotente: agrega
// únicamente los vuelos cuyo código todavía no existe, así que se puede ejecutar en cada
// arranque sin duplicar nada. Las fechas son relativas al día en que se cargan.
public static class DatosDePrueba
{
    // (código, origen, destino, días desde hoy, hora local de salida, minutos de vuelo,
    //  precio, asientos, ejecutivos, estado)
    private static readonly (string Codigo, string Origen, string Destino, int Dias, int Hora, int Minuto,
        int Minutos, decimal Precio, int Asientos, int Ejecutivos, EstadoVuelo Estado)[] Vuelos =
    {
        ("AR1100", "Buenos Aires", "Córdoba",       1,  7, 30,  75,  89000m,   48, 6, EstadoVuelo.Programado),
        ("AR1102", "Buenos Aires", "Mendoza",       2,  9, 15, 110, 132000m,   42, 6, EstadoVuelo.Programado),
        ("AR1104", "Buenos Aires", "Bariloche",     3, 11,  0, 140, 168500m,   54, 6, EstadoVuelo.Programado),
        ("AR1106", "Buenos Aires", "Salta",         4,  6, 45, 135, 147000m,   36, 4, EstadoVuelo.Programado),
        ("AR1108", "Buenos Aires", "Ushuaia",       6,  8, 20, 210, 245000m,   42, 6, EstadoVuelo.Programado),
        ("AR1110", "Buenos Aires", "Puerto Iguazú", 7, 13, 40, 110, 139900m,   36, 4, EstadoVuelo.Programado),
        ("AR1112", "Buenos Aires", "Mar del Plata", 9, 18, 10,  55,  61500m,   24, 0, EstadoVuelo.Programado),
        ("AR1114", "Córdoba",      "Bariloche",    10, 10, 30, 120, 154000m,   30, 4, EstadoVuelo.Programado),
        ("AR1116", "Mendoza",      "Córdoba",      12, 16,  0,  70,  78000m,   24, 2, EstadoVuelo.Programado),
        ("AR1118", "Buenos Aires", "Neuquén",      14,  7,  0, 105, 118000m,   36, 4, EstadoVuelo.Programado),
        ("AR1120", "Buenos Aires", "Tucumán",      17, 19, 30, 120, 126000m,   30, 4, EstadoVuelo.Programado),
        ("AR1122", "Salta",        "Puerto Iguazú",21, 12, 15, 125, 133000m,   24, 2, EstadoVuelo.Programado),
        ("AR1124", "Buenos Aires", "Trelew",       25,  9, 50, 115, 121000m,   30, 4, EstadoVuelo.Programado),
        ("AR1126", "Bariloche",    "Buenos Aires", 30, 17, 20, 140, 171000m,   54, 6, EstadoVuelo.Programado),
        ("AR1128", "Buenos Aires", "Comodoro Rivadavia", 8, 15, 0, 140, 158000m, 30, 4, EstadoVuelo.Cancelado),
    };

    // Las horas de la tabla son de Argentina (UTC-3): se guardan en UTC.
    private const int DiferenciaUtcArgentina = 3;

    public static void Sembrar(AppDbContext contexto)
    {
        var existentes = contexto.Vuelos.Select(v => v.NumeroVuelo).ToHashSet();
        DateTime hoy = DateTime.UtcNow.Date;

        var nuevos = Vuelos
            .Where(v => !existentes.Contains(v.Codigo))
            .Select(v => CrearVuelo(
                v.Codigo, v.Origen, v.Destino,
                hoy.AddDays(v.Dias).AddHours(v.Hora + DiferenciaUtcArgentina).AddMinutes(v.Minuto),
                v.Minutos, v.Precio, v.Asientos, v.Ejecutivos, v.Estado))
            .ToList();

        if (nuevos.Count == 0) return;

        contexto.Vuelos.AddRange(nuevos);
        contexto.SaveChanges();
    }

    private static Vuelo CrearVuelo(string codigo, string origen, string destino, DateTime salida,
        int minutosDeVuelo, decimal precio, int cantidadAsientos, int ejecutivos, EstadoVuelo estado)
    {
        var vuelo = new Vuelo
        {
            NumeroVuelo = codigo,
            Origen = origen,
            Destino = destino,
            FechaSalida = DateTime.SpecifyKind(salida, DateTimeKind.Utc),
            FechaLlegada = DateTime.SpecifyKind(salida.AddMinutes(minutosDeVuelo), DateTimeKind.Utc),
            PrecioBase = precio,
            Capacidad = cantidadAsientos,
            Estado = estado
        };

        for (int i = 1; i <= cantidadAsientos; i++)
        {
            vuelo.Asientos.Add(new Asiento
            {
                Numero = i.ToString("D2"),
                Categoria = i <= ejecutivos ? CategoriaAsiento.Ejecutivo : CategoriaAsiento.Turista
            });
        }

        return vuelo;
    }
}