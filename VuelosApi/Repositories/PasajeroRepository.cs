using Microsoft.EntityFrameworkCore;
using VuelosApi.Config;
using VuelosApi.Models;

namespace VuelosApi.Repositories;

public class PasajeroRepository : IPasajeroRepository
{
    private readonly AppDbContext _contexto;

    public PasajeroRepository(AppDbContext contexto)
    {
        _contexto = contexto;
    }

    public async Task<List<Pasajero>> ObtenerTodosAsync()
    {
        return await _contexto.Pasajeros
            .AsNoTracking()
            .OrderBy(p => p.Apellido)
            .ThenBy(p => p.Nombre)
            .ToListAsync();
    }

    public async Task<Pasajero?> ObtenerPorIdAsync(int id)
    {
        return await _contexto.Pasajeros.FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<bool> ExistePorDniAsync(string dni)
    {
        return await _contexto.Pasajeros.AnyAsync(p => p.DNI == dni);
    }

    public async Task<bool> TieneReservasAsync(int pasajeroId)
    {
        return await _contexto.Reservas.AnyAsync(r => r.PasajeroId == pasajeroId);
    }

    public async Task AgregarAsync(Pasajero pasajero)
    {
        await _contexto.Pasajeros.AddAsync(pasajero);
    }

    public void Eliminar(Pasajero pasajero)
    {
        _contexto.Pasajeros.Remove(pasajero);
    }

    public async Task GuardarCambiosAsync()
    {
        await _contexto.SaveChangesAsync();
    }
}
