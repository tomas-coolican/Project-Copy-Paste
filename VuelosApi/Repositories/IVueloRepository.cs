using VuelosApi.Models;

namespace VuelosApi.Repositories;

public interface IVueloRepository
{
    // Vuelos con sus asientos y las reservas de cada asiento (para calcular la disponibilidad).
    Task<List<Vuelo>> ObtenerTodosAsync();
    Task<Vuelo?> ObtenerPorIdAsync(int id);

    Task<bool> ExisteCodigoAsync(string codigo, int? excluirVueloId = null);

    // Cantidad de reservas de un vuelo (soloActivas = solo las Confirmadas).
    Task<int> ContarReservasAsync(int vueloId, bool soloActivas);

    Task AgregarAsync(Vuelo vuelo);
    void Eliminar(Vuelo vuelo);
    void EliminarAsientos(IEnumerable<Asiento> asientos);
    Task GuardarCambiosAsync();
}
