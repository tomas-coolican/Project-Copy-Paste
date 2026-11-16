using Microsoft.EntityFrameworkCore;
using Npgsql;
using VuelosApi.Config;
using VuelosApi.Enums;
using VuelosApi.Exceptions;
using VuelosApi.Models;

namespace VuelosApi.Repositories;

public class ReservaRepository : IReservaRepository
{
    private readonly AppDbContext _contexto;

    public ReservaRepository(AppDbContext contexto)
    {
        _contexto = contexto;
    }

    public async Task<List<Reserva>> ObtenerTodasAsync()
    {
        return await _contexto.Reservas
            .AsNoTracking()
            .Include(r => r.Pasajero)
            .Include(r => r.Usuario)
            .Include(r => r.Vuelo)
            .Include(r => r.Asiento)
            .OrderByDescending(r => r.FechaReserva)
            .ToListAsync();
    }

    public async Task<List<Reserva>> ObtenerPorUsuarioAsync(int usuarioId)
    {
        return await _contexto.Reservas
            .AsNoTracking()
            .Where(r => r.UsuarioId == usuarioId)
            .Include(r => r.Pasajero)
            .Include(r => r.Usuario)
            .Include(r => r.Vuelo)
            .Include(r => r.Asiento)
            .OrderByDescending(r => r.FechaReserva)
            .ToListAsync();
    }

    public async Task<Reserva?> ObtenerPorIdAsync(int id)
    {
        // Se mantiene tracking porque este método también se utiliza para cancelar.
        return await _contexto.Reservas
            .Include(r => r.Pasajero)
            .Include(r => r.Usuario)
            .Include(r => r.Vuelo)
            .Include(r => r.Asiento)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<Pasajero?> ObtenerPasajeroPorIdAsync(int id)
    {
        return await _contexto.Pasajeros
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Pasajero?> ObtenerPasajeroPorDniAsync(string dni)
    {
        return await _contexto.Pasajeros
            .FirstOrDefaultAsync(p => p.DNI == dni);
    }

    public async Task AgregarPasajeroAsync(Pasajero pasajero)
    {
        await _contexto.Pasajeros.AddAsync(pasajero);
    }

    public async Task<Vuelo?> ObtenerVueloPorIdAsync(int id)
    {
        return await _contexto.Vuelos
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == id);
    }

    public async Task<Asiento?> ObtenerAsientoPorIdYVueloAsync(int asientoId, int vueloId)
    {
        return await _contexto.Asientos
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == asientoId && a.VueloId == vueloId);
    }

    public async Task<bool> ExisteReservaActivaPorAsientoAsync(int asientoId)
    {
        return await _contexto.Reservas
            .AnyAsync(r => r.AsientoId == asientoId && r.Estado == EstadoReserva.Confirmada);
    }

    public async Task<bool> ExisteReservaActivaPorPasajeroYVueloAsync(int pasajeroId, int vueloId)
    {
        return await _contexto.Reservas
            .AnyAsync(r => r.PasajeroId == pasajeroId
                && r.VueloId == vueloId
                && r.Estado == EstadoReserva.Confirmada);
    }

    public async Task AgregarAsync(Reserva reserva)
    {
        await _contexto.Reservas.AddAsync(reserva);
    }

    public async Task GuardarCambiosAsync()
    {
        try
        {
            await _contexto.SaveChangesAsync();
        }
        catch (DbUpdateException error) when (
            error.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation
            })
        {
            // Dos pedidos al mismo tiempo: los índices únicos filtrados de la base frenan al segundo.
            throw new ConflictoException(
                "El asiento o el pasajero ya tiene una reserva confirmada para este vuelo.");
        }
    }
}
