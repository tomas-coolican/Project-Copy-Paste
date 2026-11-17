using VuelosApi.Dtos;
using VuelosApi.Dtos.Reserva;

namespace VuelosApi.Services;

public interface IReservaService
{
    // Usuario: sus reservas. Administrador: todas. Con filtros y paginación opcionales.
    Task<ResultadoPaginado<ReservaDTO>> ObtenerTodasAsync(
        int usuarioId, bool esAdministrador, FiltroReservas filtro, ParametrosPaginacion paginacion);
    Task<ReservaDTO?> ObtenerPorIdAsync(int id, int usuarioId, bool esAdministrador);
    // esAdministrador: solo el Administrador puede reservar indicando un pasajeroId existente.
    Task<ReservaDTO> CrearAsync(CrearReservaDTO dto, int usuarioId, bool esAdministrador);
    Task<bool> CancelarAsync(int id, int usuarioId, bool esAdministrador);
}
