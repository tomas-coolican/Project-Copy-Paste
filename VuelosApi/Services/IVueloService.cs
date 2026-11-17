using VuelosApi.Dtos;
using VuelosApi.Dtos.Vuelo;

namespace VuelosApi.Services;

public interface IVueloService
{
    // Sin paginación activa devuelve todos los vuelos; Total es siempre la cantidad sin paginar.
    Task<ResultadoPaginado<VueloDTO>> ObtenerTodosAsync(ParametrosPaginacion paginacion);

    // Devuelve null si el vuelo no existe.
    Task<VueloDetalleDTO?> ObtenerPorIdAsync(int id);
    Task<VueloDetalleDTO> CrearAsync(CrearVueloDTO dto);
    Task<VueloDetalleDTO?> ActualizarAsync(int id, ActualizarVueloDTO dto);

    // Devuelve false si el vuelo no existe.
    Task<bool> EliminarAsync(int id);
}
