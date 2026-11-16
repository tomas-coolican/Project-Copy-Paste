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
    public int UsuarioId { get; set; }
    public string UsuarioNombre { get; set; } = string.Empty;
    public ReservaVueloDTO Vuelo { get; set; } = new();
    public ReservaAsientoDTO Asiento { get; set; } = new();
}