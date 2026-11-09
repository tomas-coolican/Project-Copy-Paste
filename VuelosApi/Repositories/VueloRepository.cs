using Microsoft.EntityFrameworkCore;
using VuelosApi.Config;
using VuelosApi.Enums;
using VuelosApi.Models;

namespace VuelosApi.Repositories;

public class VueloRepository : IVueloRepository
{
    private readonly AppDbContext _context;

    public VueloRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Vuelo>> ObtenerTodosAsync()
    {
        return await _context.Vuelos
            .Include(v => v.Asientos)
                .ThenInclude(a => a.Reservas)
            .AsNoTracking()
            .OrderBy(v => v.FechaSalida)
            .ToListAsync();
    }

    public async Task<Vuelo?> ObtenerPorIdAsync(int id)
    {
        return await _context.Vuelos
            .Include(v => v.Asientos)
                .ThenInclude(a => a.Reservas)
            .FirstOrDefaultAsync(v => v.Id == id);
    }

    public async Task<bool> ExisteCodigoAsync(string codigo, int? excluirVueloId = null)
    {
        return await _context.Vuelos
            .AnyAsync(v => v.NumeroVuelo == codigo && (excluirVueloId == null || v.Id != excluirVueloId));
    }

    public async Task<int> ContarReservasAsync(int vueloId, bool soloActivas)
    {
        var consulta = _context.Reservas.Where(r => r.VueloId == vueloId);

        if (soloActivas)
            consulta = consulta.Where(r => r.Estado == EstadoReserva.Confirmada);

        return await consulta.CountAsync();
    }

    public async Task AgregarAsync(Vuelo vuelo)
    {
        await _context.Vuelos.AddAsync(vuelo);
    }

    public void Eliminar(Vuelo vuelo)
    {
        _context.Vuelos.Remove(vuelo);
    }

    public void EliminarAsientos(IEnumerable<Asiento> asientos)
    {
        _context.Asientos.RemoveRange(asientos);
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}
