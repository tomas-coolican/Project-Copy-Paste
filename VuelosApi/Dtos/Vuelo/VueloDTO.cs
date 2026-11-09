using VuelosApi.Enums;

namespace VuelosApi.Dtos.Vuelo;

// Vuelo (listado): GET /api/vuelos
public class VueloDTO
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Origen { get; set; } = string.Empty;
    public string Destino { get; set; } = string.Empty;
    public DateTime FechaSalida { get; set; }
    public DateTime FechaLlegada { get; set; }
    public decimal Precio { get; set; }
    public int AsientosDisponibles { get; set; }
    public EstadoVuelo Estado { get; set; }
}
