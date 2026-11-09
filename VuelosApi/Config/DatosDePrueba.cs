using VuelosApi.Enums;
using VuelosApi.Models;

namespace VuelosApi.Config;

// Datos de prueba de vuelos con sus asientos, para que el frontend trabaje sin mocks.
// Se cargan solo en Development y solo si todavía no hay vuelos.
public static class DatosDePrueba
{
    public static void Sembrar(AppDbContext contexto)
    {
        if (contexto.Vuelos.Any()) return;

        contexto.Vuelos.AddRange(
            CrearVuelo("AR1234", "Buenos Aires", "Córdoba", new DateTime(2026, 12, 1, 14, 30, 0, DateTimeKind.Utc), 90, 125000.50m, 30, 4),
            CrearVuelo("AR2020", "Buenos Aires", "Mendoza", new DateTime(2026, 12, 5, 9, 0, 0, DateTimeKind.Utc), 120, 150000m, 24, 4),
            CrearVuelo("AR3050", "Córdoba", "Bariloche", new DateTime(2026, 12, 10, 18, 15, 0, DateTimeKind.Utc), 150, 185000m, 18, 2));

        contexto.SaveChanges();
    }

    private static Vuelo CrearVuelo(string codigo, string origen, string destino, DateTime salida,
        int minutosDeVuelo, decimal precio, int cantidadAsientos, int ejecutivos)
    {
        var vuelo = new Vuelo
        {
            NumeroVuelo = codigo,
            Origen = origen,
            Destino = destino,
            FechaSalida = salida,
            FechaLlegada = salida.AddMinutes(minutosDeVuelo),
            PrecioBase = precio,
            Capacidad = cantidadAsientos,
            Estado = EstadoVuelo.Programado
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
