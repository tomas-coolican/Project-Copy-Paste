using Microsoft.EntityFrameworkCore;
using VuelosApi.Dtos.Reserva;
using VuelosApi.Enums;
using VuelosApi.Models;
using VuelosApi.Repositories;

namespace VuelosApi.Services;

public class ReservasService
{
    private readonly Repository<Reserva> _repositorioReservas;
    private readonly Repository<Pasajero> _repositorioPasajeros;
    private readonly Repository<Vuelo> _repositorioVuelos;
    private readonly Repository<Asiento> _repositorioAsientos;

    public ReservasService(
        Repository<Reserva> repositorioReservas,
        Repository<Pasajero> repositorioPasajeros,
        Repository<Vuelo> repositorioVuelos,
        Repository<Asiento> repositorioAsientos)
    {
        _repositorioReservas = repositorioReservas;
        _repositorioPasajeros = repositorioPasajeros;
        _repositorioVuelos = repositorioVuelos;
        _repositorioAsientos = repositorioAsientos;
    }

    public async Task<List<ReservaDTO>> ObtenerTodasAsync()
    {
        var reservas = await _repositorioReservas.Consultar()
            .Include(r => r.Pasajero)
            .Include(r => r.Vuelo)
            .Include(r => r.Asiento)
            .ToListAsync();

        return reservas.Select(ConvertirADTO).ToList();
    }

    public async Task<ReservaDTO?> ObtenerPorIdAsync(int id)
    {
        var reserva = await _repositorioReservas.Consultar()
            .Include(r => r.Pasajero)
            .Include(r => r.Vuelo)
            .Include(r => r.Asiento)
            .FirstOrDefaultAsync(r => r.Id == id);

        return reserva == null ? null : ConvertirADTO(reserva);
    }

    public async Task<ReservaDTO> CrearAsync(CrearReservaDTO dto)
    {
        var pasajero = await _repositorioPasajeros.ObtenerPorIdAsync(dto.PasajeroId);
        if (pasajero == null)
            throw new InvalidOperationException("El pasajero indicado no existe.");

        var vuelo = await _repositorioVuelos.ObtenerPorIdAsync(dto.VueloId);
        if (vuelo == null)
            throw new InvalidOperationException("El vuelo indicado no existe.");

        if (vuelo.Estado != EstadoVuelo.Programado)
            throw new InvalidOperationException("Solo se pueden reservar vuelos programados.");

        if (vuelo.FechaSalida <= DateTime.Now)
            throw new InvalidOperationException("No se puede reservar un vuelo que ya salió.");

        var asiento = await _repositorioAsientos.Consultar()
            .Include(a => a.Reservas)
            .FirstOrDefaultAsync(a => a.Id == dto.AsientoId && a.VueloId == dto.VueloId);

        if (asiento == null)
            throw new InvalidOperationException("El asiento no existe para el vuelo seleccionado.");

        bool ocupado = asiento.Reservas.Any(r => r.Estado == EstadoReserva.Confirmada);
        if (ocupado)
            throw new InvalidOperationException("El asiento ya está reservado.");

        decimal precio = vuelo.PrecioBase;
        if (asiento.Categoria == CategoriaAsiento.Ejecutivo)
            precio *= 1.5m;

        var reserva = new Reserva
        {
            PasajeroId = dto.PasajeroId,
            VueloId = dto.VueloId,
            AsientoId = dto.AsientoId,
            FechaReserva = DateTime.Now,
            Estado = EstadoReserva.Confirmada,
            PrecioPagado = precio
        };

        await _repositorioReservas.AgregarAsync(reserva);
        await _repositorioReservas.GuardarCambiosAsync();

        return await ObtenerPorIdAsync(reserva.Id) ?? throw new InvalidOperationException("No se pudo recuperar la reserva creada.");
    }

    public async Task<bool> CancelarAsync(int id)
    {
        var reserva = await _repositorioReservas.ObtenerPorIdAsync(id);
        if (reserva == null) return false;

        if (reserva.Estado == EstadoReserva.Cancelada)
            throw new InvalidOperationException("La reserva ya está cancelada.");

        reserva.Estado = EstadoReserva.Cancelada;
        _repositorioReservas.Actualizar(reserva);
        await _repositorioReservas.GuardarCambiosAsync();
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
            NombrePasajero = reserva.Pasajero == null ? "" : reserva.Pasajero.Nombre + " " + reserva.Pasajero.Apellido,
            VueloId = reserva.VueloId,
            NumeroVuelo = reserva.Vuelo?.NumeroVuelo ?? "",
            AsientoId = reserva.AsientoId,
            NumeroAsiento = reserva.Asiento?.Numero ?? ""
        };
    }
}
