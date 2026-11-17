using VuelosApi.Dtos;
using VuelosApi.Dtos.Vuelo;
using VuelosApi.Enums;
using VuelosApi.Exceptions;
using VuelosApi.Models;
using VuelosApi.Repositories;

namespace VuelosApi.Services;

public class VueloService : IVueloService
{
    private readonly IVueloRepository _repositorio;

    public VueloService(IVueloRepository repositorio)
    {
        _repositorio = repositorio;
    }

    public async Task<ResultadoPaginado<VueloDTO>> ObtenerTodosAsync(ParametrosPaginacion paginacion)
    {
        var vuelos = paginacion.Activa
            ? await _repositorio.ObtenerTodosAsync(paginacion.Saltar, paginacion.Tomar)
            : await _repositorio.ObtenerTodosAsync();

        int total = paginacion.Activa ? await _repositorio.ContarAsync() : vuelos.Count;
        return new ResultadoPaginado<VueloDTO>(vuelos.Select(ConvertirADTO).ToList(), total);
    }

    public async Task<VueloDetalleDTO?> ObtenerPorIdAsync(int id)
    {
        var vuelo = await _repositorio.ObtenerPorIdAsync(id);
        return vuelo == null ? null : ConvertirADetalle(vuelo);
    }

    public async Task<VueloDetalleDTO> CrearAsync(CrearVueloDTO dto)
    {
        if (await _repositorio.ExisteCodigoAsync(dto.Codigo))
            throw new ConflictoException($"Ya existe un vuelo con el código {dto.Codigo}.");

        var vuelo = new Vuelo
        {
            NumeroVuelo = dto.Codigo,
            Origen = dto.Origen,
            Destino = dto.Destino,
            FechaSalida = dto.FechaSalida!.Value,
            FechaLlegada = dto.FechaLlegada!.Value,
            PrecioBase = dto.Precio,
            Capacidad = dto.CantidadAsientos,
            Estado = EstadoVuelo.Programado
        };

        // Los asientos se generan junto con el vuelo y se guardan en una sola operación.
        for (int i = 1; i <= dto.CantidadAsientos; i++)
        {
            vuelo.Asientos.Add(new Asiento
            {
                Numero = i.ToString("D2"),
                Categoria = i <= dto.CantidadAsientosEjecutivos
                    ? CategoriaAsiento.Ejecutivo
                    : CategoriaAsiento.Turista
            });
        }

        await _repositorio.AgregarAsync(vuelo);
        await _repositorio.GuardarCambiosAsync();

        return ConvertirADetalle(vuelo);
    }

    public async Task<VueloDetalleDTO?> ActualizarAsync(int id, ActualizarVueloDTO dto)
    {
        var vuelo = await _repositorio.ObtenerPorIdAsync(id);
        if (vuelo == null) return null;

        if (await _repositorio.ExisteCodigoAsync(dto.Codigo, id))
            throw new ConflictoException($"Ya existe un vuelo con el código {dto.Codigo}.");

        await AjustarCapacidadAsync(vuelo, dto.CantidadAsientos);

        vuelo.NumeroVuelo = dto.Codigo;
        vuelo.Origen = dto.Origen;
        vuelo.Destino = dto.Destino;
        vuelo.FechaSalida = dto.FechaSalida!.Value;
        vuelo.FechaLlegada = dto.FechaLlegada!.Value;
        vuelo.PrecioBase = dto.Precio;
        vuelo.Capacidad = dto.CantidadAsientos;

        if (dto.Estado.HasValue)
        {
            // Si el vuelo pasa a Cancelado, sus reservas confirmadas se cancelan también:
            // si no, el pasajero seguiría viendo "Confirmada" en un vuelo que no sale.
            if (dto.Estado.Value == EstadoVuelo.Cancelado && vuelo.Estado != EstadoVuelo.Cancelado)
                CancelarReservasConfirmadas(vuelo);

            vuelo.Estado = dto.Estado.Value;
        }

        await _repositorio.GuardarCambiosAsync();

        return ConvertirADetalle(vuelo);
    }

    public async Task<bool> EliminarAsync(int id)
    {
        var vuelo = await _repositorio.ObtenerPorIdAsync(id);
        if (vuelo == null) return false;

        // D7 (propuesto): se rechaza si el vuelo tiene reservas. Se cuentan también las
        // canceladas, porque la base no permite borrar un vuelo con reservas (FK Restrict).
        int reservas = await _repositorio.ContarReservasAsync(id, soloActivas: false);
        if (reservas > 0)
            throw new ConflictoException(
                $"No se puede eliminar el vuelo: tiene {reservas} reserva(s) registrada(s).");

        _repositorio.Eliminar(vuelo);
        await _repositorio.GuardarCambiosAsync();
        return true;
    }

    // Regla de capacidad: no se puede reducir por debajo de las reservas existentes y nunca
    // se quita un asiento con reservas. Los asientos que se agregan continúan la numeración.
    private async Task AjustarCapacidadAsync(Vuelo vuelo, int nuevaCantidad)
    {
        int actual = vuelo.Asientos.Count;

        if (nuevaCantidad > actual)
        {
            for (int i = actual + 1; i <= nuevaCantidad; i++)
            {
                vuelo.Asientos.Add(new Asiento
                {
                    Numero = i.ToString("D2"),
                    Categoria = CategoriaAsiento.Turista
                });
            }
            return;
        }

        if (nuevaCantidad == actual) return;

        // D6 (propuesto): "reservas existentes" = solo las activas (Confirmadas).
        int activas = await _repositorio.ContarReservasAsync(vuelo.Id, soloActivas: true);
        if (activas > nuevaCantidad)
            throw new ConflictoException(
                $"No se puede reducir la capacidad a {nuevaCantidad} asientos: el vuelo tiene {activas} reservas.");

        // Se quitan los últimos asientos (los de mayor id, que son los últimos numerados).
        var aQuitar = vuelo.Asientos
            .OrderByDescending(a => a.Id)
            .Take(actual - nuevaCantidad)
            .ToList();

        // Un asiento con reservas (activas o canceladas) no se puede borrar.
        var conReservas = aQuitar.Where(a => a.Reservas.Count > 0).ToList();
        if (conReservas.Count > 0)
        {
            string numeros = string.Join(", ", conReservas.Select(a => a.Numero).OrderBy(n => n));
            throw new ConflictoException(
                $"No se puede reducir la capacidad a {nuevaCantidad} asientos: los asientos {numeros} tienen reservas.");
        }

        foreach (var asiento in aQuitar)
            vuelo.Asientos.Remove(asiento);

        _repositorio.EliminarAsientos(aQuitar);
    }

    private static bool EstaDisponible(Asiento asiento)
    {
        return !asiento.Reservas.Any(r => r.Estado == EstadoReserva.Confirmada);
    }

    // El vuelo se cargó con asientos y reservas (con tracking), así que el cambio de estado
    // se guarda en el mismo GuardarCambiosAsync del PUT.
    private static void CancelarReservasConfirmadas(Vuelo vuelo)
    {
        foreach (var reserva in vuelo.Asientos.SelectMany(a => a.Reservas))
        {
            if (reserva.Estado == EstadoReserva.Confirmada)
                reserva.Estado = EstadoReserva.Cancelada;
        }
    }

    // Estado que ve el usuario: el guardado, salvo que el horario ya indique otra cosa.
    // Un vuelo Programado pasa a "En vuelo" entre la salida y la llegada, y a "Finalizado"
    // después de la llegada. Cancelado nunca cambia solo. No se escribe en la base.
    private static EstadoVuelo EstadoSegunHorario(Vuelo vuelo)
    {
        if (vuelo.Estado is EstadoVuelo.Cancelado or EstadoVuelo.Finalizado)
            return vuelo.Estado;

        DateTime ahora = DateTime.UtcNow;
        if (ahora >= vuelo.FechaLlegada) return EstadoVuelo.Finalizado;
        if (ahora >= vuelo.FechaSalida) return EstadoVuelo.EnVuelo;
        return vuelo.Estado;
    }

    private static VueloDTO ConvertirADTO(Vuelo vuelo)
    {
        return new VueloDTO
        {
            Id = vuelo.Id,
            Codigo = vuelo.NumeroVuelo,
            Origen = vuelo.Origen,
            Destino = vuelo.Destino,
            FechaSalida = vuelo.FechaSalida,
            FechaLlegada = vuelo.FechaLlegada,
            Precio = vuelo.PrecioBase,
            AsientosTotales = vuelo.Asientos.Count,
            AsientosDisponibles = vuelo.Asientos.Count(EstaDisponible),
            Estado = EstadoSegunHorario(vuelo)
        };
    }

    private static VueloDetalleDTO ConvertirADetalle(Vuelo vuelo)
    {
        var basico = ConvertirADTO(vuelo);

        return new VueloDetalleDTO
        {
            Id = basico.Id,
            Codigo = basico.Codigo,
            Origen = basico.Origen,
            Destino = basico.Destino,
            FechaSalida = basico.FechaSalida,
            FechaLlegada = basico.FechaLlegada,
            Precio = basico.Precio,
            AsientosDisponibles = basico.AsientosDisponibles,
            Estado = basico.Estado,
            AsientosTotales = basico.AsientosTotales,
            Asientos = vuelo.Asientos
                .OrderBy(a => a.Id)
                .Select(a => new AsientoDTO
                {
                    Id = a.Id,
                    Numero = a.Numero,
                    Categoria = a.Categoria,
                    Disponible = EstaDisponible(a)
                })
                .ToList()
        };
    }
}
