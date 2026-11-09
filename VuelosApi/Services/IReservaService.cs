using VuelosApi.Dtos.Reserva;

namespace VuelosApi.Services;

public interface IReservaService
{
    Task<List<ReservaDTO>> ObtenerTodasAsync(int usuarioId, bool esAdministrador);
    Task<ReservaDTO?> ObtenerPorIdAsync(int id, int usuarioId, bool esAdministrador);
    Task<ReservaDTO> CrearAsync(CrearReservaDTO dto, int usuarioId);
    Task<bool> CancelarAsync(int id, int usuarioId, bool esAdministrador);
}
