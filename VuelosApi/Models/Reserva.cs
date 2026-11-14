using VuelosApi.Enums;

namespace VuelosApi.Models;

public class Reserva
{
    public int Id { get; set; }
    public DateTime FechaReserva { get; set; } = DateTime.Now;
    public EstadoReserva Estado { get; set; } = EstadoReserva.Confirmada;
    public decimal PrecioPagado { get; set; }

    public int PasajeroId { get; set; }
    public Pasajero? Pasajero { get; set; }

    public int VueloId { get; set; }
    public Vuelo? Vuelo { get; set; }

    public int AsientoId { get; set; }
    public Asiento? Asiento { get; set; }
}
