using System.ComponentModel.DataAnnotations;

namespace VuelosApi.Dtos.Vuelo;

public class CrearVueloDTO
{
    [Required, MaxLength(20)]
    public string NumeroVuelo { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    public string Origen { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    public string Destino { get; set; } = string.Empty;

    public DateTime FechaSalida { get; set; }
    public DateTime FechaLlegada { get; set; }

    [Range(1, 500)]
    public int Capacidad { get; set; }

    [Range(0, 100000000)]
    public decimal PrecioBase { get; set; }

    public int CantidadAsientosEjecutivos { get; set; } = 0;
}
