using Microsoft.EntityFrameworkCore;
using VuelosApi.Dtos.Reserva;
using Npgsql;
using VuelosApi.Enums;
using VuelosApi.Models;
using VuelosApi.Repositories;

namespace VuelosApi.Services;

public class ReservaService : IReservaService
{
    private readonly IReservaRepository _repositorio;

    public ReservaService(IReservaRepository repositorio)
    {
        _repositorio = repositorio;
    }

    public async Task<List<ReservaDTO>> ObtenerTodasAsync(int usuarioId, bool esAdministrador)
    {
        var reservas = esAdministrador
            ? await _repositorio.ObtenerTodasAsync()
            : await _repositorio.ObtenerPorUsuarioAsync(usuarioId);

        return reservas.Select(ConvertirADTO).ToList();
    }

    public async Task<ReservaDTO?> ObtenerPorIdAsync(int id, int usuarioId, bool esAdministrador)
    {
        var reserva = await _repositorio.ObtenerPorIdAsync(id);
        if (reserva == null)
            return null;

        if (!esAdministrador && reserva.UsuarioId != usuarioId)
            throw new UnauthorizedAccessException("No tenés permiso para ver esta reserva.");

        return ConvertirADTO(reserva);
    }

    public async Task<ReservaDTO> CrearAsync(CrearReservaDTO dto, int usuarioId)
    {
        if (usuarioId <= 0)
            throw new UnauthorizedAccessException("No se pudo identificar al usuario.");

        var pasajero = await _repositorio.ObtenerPasajeroPorIdAsync(dto.PasajeroId);
        if (pasajero == null)
            throw new KeyNotFoundException("El pasajero indicado no existe.");

        var vuelo = await _repositorio.ObtenerVueloPorIdAsync(dto.VueloId);
        if (vuelo == null)
            throw new KeyNotFoundException("El vuelo indicado no existe.");

        if (vuelo.Estado != EstadoVuelo.Programado)
            throw new InvalidOperationException("Solo se pueden reservar vuelos programados.");

        if (vuelo.FechaSalida <= DateTime.UtcNow)
            throw new InvalidOperationException("No se puede reservar un vuelo que ya salió.");

        var asiento = await _repositorio.ObtenerAsientoPorIdYVueloAsync(dto.AsientoId, dto.VueloId);
        if (asiento == null)
            throw new KeyNotFoundException("El asiento no existe o no pertenece a ese vuelo.");

        if (await _repositorio.ExisteReservaActivaPorAsientoAsync(dto.AsientoId))
            throw new InvalidOperationException("El asiento ya está reservado.");

        if (await _repositorio.ExisteReservaActivaPorPasajeroYVueloAsync(dto.PasajeroId, dto.VueloId))
            throw new InvalidOperationException("El pasajero ya tiene una reserva para este vuelo.");

        decimal precio = vuelo.PrecioBase;
        if (asiento.Categoria == CategoriaAsiento.Ejecutivo)
            precio *= 1.5m;

        var reserva = new Reserva
        {
            UsuarioId = usuarioId,
            PasajeroId = dto.PasajeroId,
            VueloId = dto.VueloId,
            AsientoId = dto.AsientoId,
            FechaReserva = DateTime.UtcNow,
            Estado = EstadoReserva.Confirmada,
            PrecioPagado = precio
        };

        await _repositorio.AgregarAsync(reserva);

        try
        {
            await _repositorio.GuardarCambiosAsync();
        }
        catch (DbUpdateException error) when (
            error.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation
            })
        {
            // Dos pedidos al mismo tiempo: el índice único de la base frena al segundo.
            throw new InvalidOperationException(
                "El asiento o el pasajero ya tiene una reserva para este vuelo.", error);
        }

        var reservaCreada = await _repositorio.ObtenerPorIdAsync(reserva.Id);
        return ConvertirADTO(reservaCreada ?? reserva);
        }

    public async Task<bool> CancelarAsync(int id, int usuarioId, bool esAdministrador)
    {
        var reserva = await _repositorio.ObtenerPorIdAsync(id);
        if (reserva == null)
            return false;

        if (!esAdministrador && reserva.UsuarioId != usuarioId)
            throw new UnauthorizedAccessException("No tenés permiso para cancelar esta reserva.");

        if (reserva.Estado == EstadoReserva.Cancelada)
            throw new InvalidOperationException("La reserva ya está cancelada.");

        // No se borra, solo cambia el estado. El asiento queda libre porque ya no hay una reserva confirmada.
        reserva.Estado = EstadoReserva.Cancelada;
        await _repositorio.GuardarCambiosAsync();

        return true;
    }

    private static ReservaDTO ConvertirADTO(Reserva reserva)
    {
        return new ReservaDTO
        {
            Id = reserva.Id,
            FechaReserva = reserva.FechaReserva,
            Estado = reserva.Estado,
            PrecioPagado = reserva.PrecioPagado,
            PasajeroId = reserva.PasajeroId,
            NombrePasajero = reserva.Pasajero == null
                ? string.Empty
                : reserva.Pasajero.Nombre + " " + reserva.Pasajero.Apellido,
            VueloId = reserva.VueloId,
            NumeroVuelo = reserva.Vuelo?.NumeroVuelo ?? string.Empty,
            AsientoId = reserva.AsientoId,
            NumeroAsiento = reserva.Asiento?.Numero ?? string.Empty
        };
    }
}
