using VuelosApi.Dtos.Reserva;

namespace VuelosApi.Services;

public interface IReservaService
{
    Task<List<ReservaDTO>> ObtenerTodasAsync(int usuarioId, bool esAdministrador);
    Task<ReservaDTO?> ObtenerPorIdAsync(int id, int usuarioId, bool esAdministrador);
    // esAdministrador: solo el Administrador puede reservar indicando un pasajeroId existente.
    Task<ReservaDTO> CrearAsync(CrearReservaDTO dto, int usuarioId, bool esAdministrador);
    Task<bool> CancelarAsync(int id, int usuarioId, bool esAdministrador);
}
