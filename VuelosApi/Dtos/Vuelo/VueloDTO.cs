using VuelosApi.Enums;

namespace VuelosApi.Dtos.Vuelo;

public class VueloDTO
{
    public int Id { get; set; }
    public string NumeroVuelo { get; set; } = string.Empty;
    public string Origen { get; set; } = string.Empty;
    public string Destino { get; set; } = string.Empty;
    public DateTime FechaSalida { get; set; }
    public DateTime FechaLlegada { get; set; }
    public int Capacidad { get; set; }
    public int AsientosDisponibles { get; set; }
    public decimal PrecioBase { get; set; }
    public EstadoVuelo Estado { get; set; }
}
