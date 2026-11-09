using VuelosApi.Dtos.Vuelo;

namespace VuelosApi.Services;

public interface IVueloService
{
    Task<List<VueloDTO>> ObtenerTodosAsync();

    // Devuelve null si el vuelo no existe.
    Task<VueloDetalleDTO?> ObtenerPorIdAsync(int id);
    Task<VueloDetalleDTO> CrearAsync(CrearVueloDTO dto);
    Task<VueloDetalleDTO?> ActualizarAsync(int id, ActualizarVueloDTO dto);

    // Devuelve false si el vuelo no existe.
    Task<bool> EliminarAsync(int id);
}
