using VuelosApi.Models;

namespace VuelosApi.Repositories;

public interface IPasajeroRepository
{
    Task<List<Pasajero>> ObtenerTodosAsync();
    Task<Pasajero?> ObtenerPorIdAsync(int id);
    Task<bool> ExistePorDniAsync(string dni);

    // Cuenta todas las reservas (también las canceladas): son historial y la FK es Restrict.
    Task<bool> TieneReservasAsync(int pasajeroId);

    Task AgregarAsync(Pasajero pasajero);
    void Eliminar(Pasajero pasajero);
    Task GuardarCambiosAsync();
}
