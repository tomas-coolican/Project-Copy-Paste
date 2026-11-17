using VuelosApi.Enums;
using VuelosApi.Models;

namespace VuelosApi.Tests.Fakes;

// Ayudantes para armar datos de prueba en memoria (sin base de datos).
public static class Datos
{
    public static DateTime EnDias(double dias) => DateTime.UtcNow.AddDays(dias);

    // Vuelo con sus asientos "01..N"; los primeros `ejecutivos` son Ejecutivo.
    // Los asientos reciben id = idVuelo * 100 + número.
    public static Vuelo Vuelo(
        int id,
        string codigo = "AR1000",
        DateTime? salida = null,
        int asientos = 6,
        int ejecutivos = 2,
        decimal precio = 1000m,
        EstadoVuelo estado = EstadoVuelo.Programado)
    {
        var fechaSalida = salida ?? EnDias(5);
        var vuelo = new Vuelo
        {
            Id = id,
            NumeroVuelo = codigo,
            Origen = "Buenos Aires",
            Destino = "Córdoba",
            FechaSalida = fechaSalida,
            FechaLlegada = fechaSalida.AddHours(2),
            Capacidad = asientos,
            PrecioBase = precio,
            Estado = estado
        };

        for (int i = 1; i <= asientos; i++)
        {
            vuelo.Asientos.Add(new Asiento
            {
                Id = id * 100 + i,
                Numero = i.ToString("D2"),
                Categoria = i <= ejecutivos ? CategoriaAsiento.Ejecutivo : CategoriaAsiento.Turista,
                VueloId = id,
                Vuelo = vuelo
            });
        }

        return vuelo;
    }

    public static Pasajero Pasajero(int id, string nombre = "Ana", string apellido = "Pérez", string dni = "30123456")
        => new() { Id = id, Nombre = nombre, Apellido = apellido, DNI = dni, Email = "" };

    public static Usuario Usuario(int id, string rol = "Usuario")
        => new() { Id = id, Nombre = $"Usuario {id}", Email = $"u{id}@test.local", PasswordHash = "x", Rol = rol };

    // Agrega una reserva ya guardada, con todas sus relaciones conectadas.
    public static Reserva Reserva(
        int id, Vuelo vuelo, Asiento asiento, Pasajero pasajero, Usuario usuario,
        EstadoReserva estado = EstadoReserva.Confirmada, DateTime? fecha = null)
    {
        var reserva = new Reserva
        {
            Id = id,
            Estado = estado,
            FechaReserva = fecha ?? DateTime.UtcNow,
            PrecioPagado = vuelo.PrecioBase,
            VueloId = vuelo.Id, Vuelo = vuelo,
            AsientoId = asiento.Id, Asiento = asiento,
            PasajeroId = pasajero.Id, Pasajero = pasajero,
            UsuarioId = usuario.Id, Usuario = usuario
        };

        asiento.Reservas.Add(reserva);
        vuelo.Reservas.Add(reserva);
        pasajero.Reservas.Add(reserva);
        return reserva;
    }
}
