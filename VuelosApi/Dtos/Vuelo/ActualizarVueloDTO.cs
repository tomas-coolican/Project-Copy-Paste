using VuelosApi.Enums;

namespace VuelosApi.Dtos.Vuelo;

public class ActualizarVueloDTO : VueloEntradaDTO
{
    // Opcional (no figura en el contrato): si no se envía, el estado no cambia.
    public EstadoVuelo? Estado { get; set; }
}
