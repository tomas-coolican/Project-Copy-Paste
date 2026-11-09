using System.ComponentModel.DataAnnotations;

namespace VuelosApi.Dtos.Reserva;

public class CrearReservaDTO
{
    [Range(1, int.MaxValue)]
    public int PasajeroId { get; set; }

    [Range(1, int.MaxValue)]
    public int VueloId { get; set; }

    [Range(1, int.MaxValue)]
    public int AsientoId { get; set; }
}
