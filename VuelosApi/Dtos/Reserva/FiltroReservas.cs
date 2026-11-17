using System.ComponentModel.DataAnnotations;
using VuelosApi.Enums;

namespace VuelosApi.Dtos.Reserva;

// Filtros opcionales de GET /api/reservas: ?estado=0&vueloId=3 (estado: 0 Confirmada, 1 Cancelada).
public class FiltroReservas
{
    public EstadoReserva? Estado { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Seleccioná un vuelo válido.")]
    public int? VueloId { get; set; }
}
