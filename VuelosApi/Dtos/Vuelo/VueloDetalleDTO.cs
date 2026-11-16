namespace VuelosApi.Dtos.Vuelo;

// Detalle de vuelo: GET /api/vuelos/{id} y respuesta de POST / PUT.
public class VueloDetalleDTO : VueloDTO
{
    public List<AsientoDTO> Asientos { get; set; } = new();
}
