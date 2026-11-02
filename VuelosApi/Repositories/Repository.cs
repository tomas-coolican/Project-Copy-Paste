using Microsoft.EntityFrameworkCore;
using VuelosApi.Config;

namespace VuelosApi.Repositories;

// Repositorio genérico: concentra las operaciones comunes de acceso a datos.
public class Repository<T> where T : class
{
    private readonly AppDbContext _context;
    private readonly DbSet<T> _tabla;

    public Repository(AppDbContext context)
    {
        _context = context;
        _tabla = context.Set<T>();
    }

    public IQueryable<T> Consultar()
    {
        return _tabla.AsQueryable();
    }

    public async Task<List<T>> ObtenerTodosAsync()
    {
        return await _tabla.ToListAsync();
    }

    public async Task<T?> ObtenerPorIdAsync(int id)
    {
        return await _tabla.FindAsync(id);
    }

    public async Task AgregarAsync(T entidad)
    {
        await _tabla.AddAsync(entidad);
    }

    public void Actualizar(T entidad)
    {
        _tabla.Update(entidad);
    }

    public void Eliminar(T entidad)
    {
        _tabla.Remove(entidad);
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }
}
