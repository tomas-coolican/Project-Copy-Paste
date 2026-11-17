using VuelosApi.Enums;
using VuelosApi.Exceptions;
using VuelosApi.Models;
using VuelosApi.Repositories;

namespace VuelosApi.Tests.Fakes;

// IReservaRepository en memoria: se comporta como el real (los ids se asignan al guardar,
// las relaciones quedan conectadas) pero sin EF Core ni PostgreSQL.
public class RepositorioReservasFalso : IReservaRepository
{
    public List<Vuelo> Vuelos { get; } = new();
    public List<Pasajero> Pasajeros { get; } = new();
    public List<Usuario> Usuarios { get; } = new();
    public List<Reserva> Reservas { get; } = new();

    // Simula que el índice único de la base rechaza el guardado (dos pedidos simultáneos).
    public bool SimularIndiceUnico { get; set; }
    public int Guardados { get; private set; }

    private readonly List<Pasajero> _pasajerosNuevos = new();
    private readonly List<Reserva> _reservasNuevas = new();

    public Task<(List<Reserva> Items, int Total)> BuscarAsync(
        int? usuarioId, EstadoReserva? estado, int? vueloId, int? saltar, int? tomar)
    {
        IEnumerable<Reserva> consulta = Reservas;
        if (usuarioId.HasValue) consulta = consulta.Where(r => r.UsuarioId == usuarioId.Value);
        if (estado.HasValue) consulta = consulta.Where(r => r.Estado == estado.Value);
        if (vueloId.HasValue) consulta = consulta.Where(r => r.VueloId == vueloId.Value);

        var filtradas = consulta.OrderByDescending(r => r.FechaReserva).ThenByDescending(r => r.Id).ToList();
        IEnumerable<Reserva> pagina = filtradas;
        if (saltar.HasValue) pagina = pagina.Skip(saltar.Value);
        if (tomar.HasValue) pagina = pagina.Take(tomar.Value);

        return Task.FromResult((pagina.ToList(), filtradas.Count));
    }

    public Task<Reserva?> ObtenerPorIdAsync(int id) =>
        Task.FromResult(Reservas.FirstOrDefault(r => r.Id == id));

    public Task<Pasajero?> ObtenerPasajeroPorIdAsync(int id) =>
        Task.FromResult(Pasajeros.FirstOrDefault(p => p.Id == id));

    public Task<Pasajero?> ObtenerPasajeroPorDniAsync(string dni) =>
        Task.FromResult(Pasajeros.FirstOrDefault(p => p.DNI == dni));

    public Task AgregarPasajeroAsync(Pasajero pasajero)
    {
        _pasajerosNuevos.Add(pasajero);
        return Task.CompletedTask;
    }

    public Task<Vuelo?> ObtenerVueloPorIdAsync(int id) =>
        Task.FromResult(Vuelos.FirstOrDefault(v => v.Id == id));

    public Task<Asiento?> ObtenerAsientoPorIdYVueloAsync(int asientoId, int vueloId) =>
        Task.FromResult(Vuelos.SelectMany(v => v.Asientos).FirstOrDefault(a => a.Id == asientoId && a.VueloId == vueloId));

    public Task<bool> ExisteReservaActivaPorAsientoAsync(int asientoId) =>
        Task.FromResult(Reservas.Any(r => r.AsientoId == asientoId && r.Estado == EstadoReserva.Confirmada));

    public Task<bool> ExisteReservaActivaPorPasajeroYVueloAsync(int pasajeroId, int vueloId) =>
        Task.FromResult(Reservas.Any(r => r.PasajeroId == pasajeroId && r.VueloId == vueloId && r.Estado == EstadoReserva.Confirmada));

    public Task AgregarAsync(Reserva reserva)
    {
        _reservasNuevas.Add(reserva);
        return Task.CompletedTask;
    }

    public Task GuardarCambiosAsync()
    {
        if (SimularIndiceUnico)
        {
            _pasajerosNuevos.Clear();
            _reservasNuevas.Clear();
            // Es lo que hace el repositorio real al recibir una violación de índice único.
            throw new ConflictoException("El asiento o el pasajero ya tiene una reserva confirmada para este vuelo.");
        }

        foreach (var pasajero in _pasajerosNuevos)
        {
            pasajero.Id = Pasajeros.Count == 0 ? 1 : Pasajeros.Max(p => p.Id) + 1;
            Pasajeros.Add(pasajero);
        }

        foreach (var reserva in _reservasNuevas)
        {
            reserva.Id = Reservas.Count == 0 ? 1 : Reservas.Max(r => r.Id) + 1;
            reserva.Pasajero ??= Pasajeros.First(p => p.Id == reserva.PasajeroId);
            reserva.PasajeroId = reserva.Pasajero.Id;
            reserva.Vuelo = Vuelos.First(v => v.Id == reserva.VueloId);
            reserva.Asiento = reserva.Vuelo.Asientos.First(a => a.Id == reserva.AsientoId);
            reserva.Usuario = Usuarios.FirstOrDefault(u => u.Id == reserva.UsuarioId);
            reserva.Asiento.Reservas.Add(reserva);
            Reservas.Add(reserva);
        }

        _pasajerosNuevos.Clear();
        _reservasNuevas.Clear();
        Guardados++;
        return Task.CompletedTask;
    }
}
