using Microsoft.EntityFrameworkCore;
using VuelosApi.Dtos.Vuelo;
using VuelosApi.Enums;
using VuelosApi.Models;
using VuelosApi.Repositories;

namespace VuelosApi.Services;

public class VuelosService
{
    private readonly Repository<Vuelo> _repositorioVuelos;
    private readonly Repository<Asiento> _repositorioAsientos;

    public VuelosService(Repository<Vuelo> repositorioVuelos, Repository<Asiento> repositorioAsientos)
    {
        _repositorioVuelos = repositorioVuelos;
        _repositorioAsientos = repositorioAsientos;
    }

    public async Task<List<VueloDTO>> ObtenerTodosAsync()
    {
        var vuelos = await _repositorioVuelos.Consultar()
            .Include(v => v.Asientos)
                .ThenInclude(a => a.Reservas)
            .ToListAsync();

        return vuelos.Select(ConvertirADTO).ToList();
    }

    public async Task<VueloDTO?> ObtenerPorIdAsync(int id)
    {
        var vuelo = await _repositorioVuelos.Consultar()
            .Include(v => v.Asientos)
                .ThenInclude(a => a.Reservas)
            .FirstOrDefaultAsync(v => v.Id == id);

        return vuelo == null ? null : ConvertirADTO(vuelo);
    }

    public async Task<VueloDTO> CrearAsync(CrearVueloDTO dto)
    {
        DateTime salida = AUtc(dto.FechaSalida);
        DateTime llegada = AUtc(dto.FechaLlegada);

        if (llegada <= salida)
            throw new InvalidOperationException("La fecha de llegada debe ser posterior a la salida.");

        if (dto.CantidadAsientosEjecutivos < 0 || dto.CantidadAsientosEjecutivos > dto.Capacidad)
            throw new InvalidOperationException("La cantidad de asientos ejecutivos no es válida.");

        bool existe = await _repositorioVuelos.Consultar()
            .AnyAsync(v => v.NumeroVuelo == dto.NumeroVuelo);

        if (existe)
            throw new InvalidOperationException("Ya existe un vuelo con ese número.");

        var vuelo = new Vuelo
        {
            NumeroVuelo = dto.NumeroVuelo,
            Origen = dto.Origen,
            Destino = dto.Destino,
            FechaSalida = salida,
            FechaLlegada = llegada,
            Capacidad = dto.Capacidad,
            PrecioBase = dto.PrecioBase,
            Estado = EstadoVuelo.Programado
        };

        await _repositorioVuelos.AgregarAsync(vuelo);
        await _repositorioVuelos.GuardarCambiosAsync();

        // Asientos del vuelo: los primeros son ejecutivos y el resto turista
        for (int i = 1; i <= dto.Capacidad; i++)
        {
            var asiento = new Asiento
            {
                Numero = i.ToString("D2"),
                Categoria = i <= dto.CantidadAsientosEjecutivos
                    ? CategoriaAsiento.Ejecutivo
                    : CategoriaAsiento.Turista,
                VueloId = vuelo.Id
            };

            await _repositorioAsientos.AgregarAsync(asiento);
        }

        await _repositorioAsientos.GuardarCambiosAsync();
        return await ObtenerPorIdAsync(vuelo.Id) ?? throw new InvalidOperationException("No se pudo recuperar el vuelo creado.");
    }

    public async Task<VueloDTO?> ActualizarAsync(int id, ActualizarVueloDTO dto)
    {
        var vuelo = await _repositorioVuelos.ObtenerPorIdAsync(id);
        if (vuelo == null) return null;

        DateTime salida = AUtc(dto.FechaSalida);
        DateTime llegada = AUtc(dto.FechaLlegada);

        if (llegada <= salida)
            throw new InvalidOperationException("La fecha de llegada debe ser posterior a la salida.");

        vuelo.Origen = dto.Origen;
        vuelo.Destino = dto.Destino;
        vuelo.FechaSalida = salida;
        vuelo.FechaLlegada = llegada;
        vuelo.PrecioBase = dto.PrecioBase;
        vuelo.Estado = dto.Estado;

        _repositorioVuelos.Actualizar(vuelo);
        await _repositorioVuelos.GuardarCambiosAsync();

        return await ObtenerPorIdAsync(id);
    }

    public async Task<bool> EliminarAsync(int id)
    {
        var vuelo = await _repositorioVuelos.Consultar()
            .Include(v => v.Reservas)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vuelo == null) return false;
        // Las reservas canceladas también cuentan: se guardan como historial y la FK no deja borrar el vuelo
        if (vuelo.Reservas.Any())
            throw new InvalidOperationException("No se puede eliminar un vuelo que tiene reservas asociadas.");

        _repositorioVuelos.Eliminar(vuelo);
        await _repositorioVuelos.GuardarCambiosAsync();
        return true;
    }

    // Postgres (timestamptz) solo acepta fechas en UTC. Si llega sin zona horaria se toma como UTC.
    private static DateTime AUtc(DateTime fecha)
    {
        return fecha.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(fecha, DateTimeKind.Utc)
            : fecha.ToUniversalTime();
    }

    private static VueloDTO ConvertirADTO(Vuelo vuelo)
    {
        int disponibles = vuelo.Asientos.Count(a => !a.Reservas.Any(r => r.Estado == EstadoReserva.Confirmada));

        return new VueloDTO
        {
            Id = vuelo.Id,
            NumeroVuelo = vuelo.NumeroVuelo,
            Origen = vuelo.Origen,
            Destino = vuelo.Destino,
            FechaSalida = vuelo.FechaSalida,
            FechaLlegada = vuelo.FechaLlegada,
            Capacidad = vuelo.Capacidad,
            AsientosDisponibles = disponibles,
            PrecioBase = vuelo.PrecioBase,
            Estado = vuelo.Estado
        };
    }
}
