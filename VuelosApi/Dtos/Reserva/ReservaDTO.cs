using VuelosApi.Enums;

namespace VuelosApi.Dtos.Reserva;

public class ReservaDTO
{
    public int Id { get; set; }
    public DateTime FechaReserva { get; set; }
    public EstadoReserva Estado { get; set; }
    public decimal PrecioPagado { get; set; }
    public int PasajeroId { get; set; }
    public string NombrePasajero { get; set; } = string.Empty;
    public int VueloId { get; set; }
    public string NumeroVuelo { get; set; } = string.Empty;
    public int AsientoId { get; set; }
    public string NumeroAsiento { get; set; } = string.Empty;
}
