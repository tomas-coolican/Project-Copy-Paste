using VuelosApi.Enums;
using VuelosApi.Models;
using VuelosApi.Repositories;

namespace VuelosApi.Tests.Fakes;

// IVueloRepository en memoria.
public class RepositorioVuelosFalso : IVueloRepository
{
    public List<Vuelo> Vuelos { get; } = new();
    public int Guardados { get; private set; }

    public Task<List<Vuelo>> ObtenerTodosAsync(int? saltar = null, int? tomar = null)
    {
        IEnumerable<Vuelo> consulta = Vuelos.OrderBy(v => v.FechaSalida).ThenBy(v => v.Id);
        if (saltar.HasValue) consulta = consulta.Skip(saltar.Value);
        if (tomar.HasValue) consulta = consulta.Take(tomar.Value);
        return Task.FromResult(consulta.ToList());
    }

    public Task<int> ContarAsync() => Task.FromResult(Vuelos.Count);

    public Task<Vuelo?> ObtenerPorIdAsync(int id) => Task.FromResult(Vuelos.FirstOrDefault(v => v.Id == id));

    public Task<bool> ExisteCodigoAsync(string codigo, int? excluirVueloId = null) =>
        Task.FromResult(Vuelos.Any(v => v.NumeroVuelo == codigo && (excluirVueloId == null || v.Id != excluirVueloId)));

    public Task<int> ContarReservasAsync(int vueloId, bool soloActivas)
    {
        var reservas = Vuelos.First(v => v.Id == vueloId).Asientos.SelectMany(a => a.Reservas);
        if (soloActivas) reservas = reservas.Where(r => r.Estado == EstadoReserva.Confirmada);
        return Task.FromResult(reservas.Count());
    }

    public Task AgregarAsync(Vuelo vuelo)
    {
        vuelo.Id = Vuelos.Count == 0 ? 1 : Vuelos.Max(v => v.Id) + 1;
        Vuelos.Add(vuelo);
        return Task.CompletedTask;
    }

    public void Eliminar(Vuelo vuelo) => Vuelos.Remove(vuelo);

    public void EliminarAsientos(IEnumerable<Asiento> asientos)
    {
        // El servicio ya los quitó de vuelo.Asientos; en memoria no hay nada más que borrar.
    }

    public Task GuardarCambiosAsync()
    {
        // Como EF Core: los asientos nuevos reciben id al guardar.
        int siguiente = Vuelos.SelectMany(v => v.Asientos).Select(a => a.Id).DefaultIfEmpty(0).Max() + 1;
        foreach (var vuelo in Vuelos)
        {
            foreach (var asiento in vuelo.Asientos.Where(a => a.Id == 0))
            {
                asiento.Id = siguiente++;
                asiento.VueloId = vuelo.Id;
                asiento.Vuelo = vuelo;
            }
        }

        Guardados++;
        return Task.CompletedTask;
    }
}
