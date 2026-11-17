using VuelosApi.Dtos.Pasajero;
using VuelosApi.Models;
using VuelosApi.Repositories;

namespace VuelosApi.Services;

// Reglas de negocio de pasajeros. El acceso a datos queda en IPasajeroRepository.
public class PasajerosService
{
    private readonly IPasajeroRepository _repositorio;

    public PasajerosService(IPasajeroRepository repositorio)
    {
        _repositorio = repositorio;
    }

    public async Task<List<PasajeroDTO>> ObtenerTodosAsync()
    {
        var pasajeros = await _repositorio.ObtenerTodosAsync();
        return pasajeros.Select(ConvertirADTO).ToList();
    }

    public async Task<PasajeroDTO?> ObtenerPorIdAsync(int id)
    {
        var pasajero = await _repositorio.ObtenerPorIdAsync(id);
        return pasajero == null ? null : ConvertirADTO(pasajero);
    }

    public async Task<PasajeroDTO> CrearAsync(CrearPasajeroDTO dto)
    {
        string dni = dto.DNI.Trim().ToUpperInvariant();
        if (await _repositorio.ExistePorDniAsync(dni))
            throw new InvalidOperationException("Ya existe un pasajero registrado con ese DNI.");

        var pasajero = new Pasajero
        {
            Nombre = dto.Nombre.Trim(),
            Apellido = dto.Apellido.Trim(),
            DNI = dni,
            Email = dto.Email.Trim(),
            Telefono = string.IsNullOrWhiteSpace(dto.Telefono) ? null : dto.Telefono.Trim()
        };

        await _repositorio.AgregarAsync(pasajero);
        await _repositorio.GuardarCambiosAsync();
        return ConvertirADTO(pasajero);
    }

    public async Task<bool> EliminarAsync(int id)
    {
        var pasajero = await _repositorio.ObtenerPorIdAsync(id);
        if (pasajero == null) return false;

        // Las reservas (incluso canceladas) quedan como historial, así que no se borra el pasajero
        if (await _repositorio.TieneReservasAsync(id))
            throw new InvalidOperationException("No se puede eliminar un pasajero que tiene reservas asociadas.");

        _repositorio.Eliminar(pasajero);
        await _repositorio.GuardarCambiosAsync();
        return true;
    }

    private static PasajeroDTO ConvertirADTO(Pasajero pasajero)
    {
        return new PasajeroDTO
        {
            Id = pasajero.Id,
            Nombre = pasajero.Nombre,
            Apellido = pasajero.Apellido,
            DNI = pasajero.DNI,
            Email = pasajero.Email,
            Telefono = pasajero.Telefono
        };
    }
}
