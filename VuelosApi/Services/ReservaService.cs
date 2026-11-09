using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using VuelosApi.Dtos.Reserva;
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
        List<Reserva> reservas;

        if (esAdministrador)
        {
            reservas = await _repositorio.ObtenerTodasAsync();
        }
        else
        {
            reservas = await _repositorio.ObtenerPorUsuarioAsync(usuarioId);
        }

        return reservas.Select(ConvertirADTO).ToList();
    }

    public async Task<ReservaDTO?> ObtenerPorIdAsync(int id, int usuarioId, bool esAdministrador)
    {
        var reserva = await _repositorio.ObtenerPorIdAsync(id);

        if (reserva == null)
            return null;

        if (!esAdministrador && reserva.UsuarioId != usuarioId)
            throw new UnauthorizedAccessException("No tenés permiso para consultar esta reserva.");

        return ConvertirADTO(reserva);
    }

    public async Task<ReservaDTO> CrearAsync(CrearReservaDTO dto, int usuarioId)
    {
        if (usuarioId <= 0)
            throw new UnauthorizedAccessException("No se pudo identificar al usuario autenticado.");

        // 1. Verificar que el pasajero exista. El DTO actual recibe PasajeroId.
        var pasajero = await _repositorio.ObtenerPasajeroPorIdAsync(dto.PasajeroId);
        if (pasajero == null)
            throw new KeyNotFoundException("El pasajero indicado no existe.");

        // 2. Verificar que el vuelo exista y se encuentre disponible para reservas.
        var vuelo = await _repositorio.ObtenerVueloPorIdAsync(dto.VueloId);
        if (vuelo == null)
            throw new KeyNotFoundException("El vuelo indicado no existe.");

        if (vuelo.Estado != EstadoVuelo.Programado)
            throw new InvalidOperationException("Solo se pueden reservar vuelos programados.");

        if (vuelo.FechaSalida <= DateTime.UtcNow)
            throw new InvalidOperationException("No se puede reservar un vuelo que ya salió.");

        // 3. Verificar que el asiento exista y pertenezca al vuelo indicado.
        var asiento = await _repositorio.ObtenerAsientoPorIdYVueloAsync(dto.AsientoId, dto.VueloId);
        if (asiento == null)
            throw new KeyNotFoundException("El asiento no existe o no pertenece al vuelo seleccionado.");

        // 4. No permitir que el mismo asiento tenga dos reservas confirmadas.
        bool asientoOcupado = await _repositorio.ExisteReservaActivaPorAsientoAsync(dto.AsientoId);
        if (asientoOcupado)
            throw new InvalidOperationException("El asiento ya tiene una reserva confirmada.");

        // 5. Regla adoptada para este módulo: un pasajero no puede tener dos
        // reservas confirmadas para el mismo vuelo, aunque seleccione otro asiento.
        bool pasajeroYaReservo = await _repositorio.ExisteReservaActivaPorPasajeroYVueloAsync(
            dto.PasajeroId, dto.VueloId);

        if (pasajeroYaReservo)
            throw new InvalidOperationException("El pasajero ya tiene una reserva confirmada para este vuelo.");

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
        catch (DbUpdateException error) when (EsViolacionDeIndiceUnico(error))
        {
            // Las comprobaciones previas cubren el flujo normal. Los índices únicos
            // de SQL Server también protegen ante dos solicitudes simultáneas.
            throw new InvalidOperationException(
                "El asiento o el pasajero ya tiene una reserva confirmada para este vuelo.", error);
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

        // Cancelación lógica: se conserva el registro y el asiento vuelve a
        // considerarse disponible porque ya no tiene una reserva Confirmada.
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

    private static bool EsViolacionDeIndiceUnico(DbUpdateException error)
    {
        return error.InnerException is SqlException sqlError
            && (sqlError.Number == 2601 || sqlError.Number == 2627);
    }
}
