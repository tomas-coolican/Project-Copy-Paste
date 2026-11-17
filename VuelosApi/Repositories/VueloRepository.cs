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

    public async Task<List<Vuelo>> ObtenerTodosAsync(int? saltar = null, int? tomar = null)
    {
        IQueryable<Vuelo> consulta = _context.Vuelos
            .Include(v => v.Asientos)
                .ThenInclude(a => a.Reservas)
            .AsNoTracking()
            .AsSplitQuery()                       // evita multiplicar filas al incluir colecciones
            .OrderBy(v => v.FechaSalida)
            .ThenBy(v => v.Id);                   // orden estable para que las páginas no se mezclen

        if (saltar.HasValue) consulta = consulta.Skip(saltar.Value);
        if (tomar.HasValue) consulta = consulta.Take(tomar.Value);

        return await consulta.ToListAsync();
    }

    public async Task<int> ContarAsync()
    {
        return await _context.Vuelos.CountAsync();
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
