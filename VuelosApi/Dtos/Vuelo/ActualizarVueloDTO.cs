using System.ComponentModel.DataAnnotations;
using VuelosApi.Enums;

namespace VuelosApi.Dtos.Vuelo;

public class ActualizarVueloDTO
{
    [Required, MaxLength(80)]
    public string Origen { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    public string Destino { get; set; } = string.Empty;

    public DateTime FechaSalida { get; set; }
    public DateTime FechaLlegada { get; set; }

    [Range(0, 100000000)]
    public decimal PrecioBase { get; set; }

    public EstadoVuelo Estado { get; set; }
}
