using VuelosApi.Models;

namespace VuelosApi.Repositories;

public interface IReservaRepository
{
    Task<List<Reserva>> ObtenerTodasAsync();
    Task<List<Reserva>> ObtenerPorUsuarioAsync(int usuarioId);
    Task<Reserva?> ObtenerPorIdAsync(int id);

    Task<Pasajero?> ObtenerPasajeroPorIdAsync(int id);
    Task<Vuelo?> ObtenerVueloPorIdAsync(int id);
    Task<Asiento?> ObtenerAsientoPorIdYVueloAsync(int asientoId, int vueloId);

    Task<bool> ExisteReservaActivaPorAsientoAsync(int asientoId);
    Task<bool> ExisteReservaActivaPorPasajeroYVueloAsync(int pasajeroId, int vueloId);

    Task AgregarAsync(Reserva reserva);
    Task GuardarCambiosAsync();
}
