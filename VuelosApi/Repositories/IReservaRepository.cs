using VuelosApi.Enums;
using VuelosApi.Models;

namespace VuelosApi.Repositories;

public interface IReservaRepository
{
    // Listado con filtros opcionales (null = sin filtrar), ordenado de la más nueva a la más vieja.
    // usuarioId: solo las de ese usuario (el Administrador pasa null para ver todas).
    // saltar/tomar paginan en la base. Total es la cantidad con filtros y sin paginar.
    Task<(List<Reserva> Items, int Total)> BuscarAsync(
        int? usuarioId, EstadoReserva? estado, int? vueloId, int? saltar, int? tomar);
    Task<Reserva?> ObtenerPorIdAsync(int id);

    // El pasajero se identifica por documento (DNI): se reutiliza si existe o se crea con la reserva.
    Task<Pasajero?> ObtenerPasajeroPorIdAsync(int id);
    Task<Pasajero?> ObtenerPasajeroPorDniAsync(string dni);
    Task AgregarPasajeroAsync(Pasajero pasajero);

    Task<Vuelo?> ObtenerVueloPorIdAsync(int id);
    Task<Asiento?> ObtenerAsientoPorIdYVueloAsync(int asientoId, int vueloId);

    Task<bool> ExisteReservaActivaPorAsientoAsync(int asientoId);
    Task<bool> ExisteReservaActivaPorPasajeroYVueloAsync(int pasajeroId, int vueloId);

    Task AgregarAsync(Reserva reserva);

    // Lanza ConflictoException si un índice único de la base rechaza el guardado
    // (dos pedidos simultáneos por el mismo asiento o el mismo pasajero en el vuelo).
    Task GuardarCambiosAsync();
}
