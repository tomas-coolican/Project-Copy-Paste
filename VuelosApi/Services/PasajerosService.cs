using Microsoft.EntityFrameworkCore;
using VuelosApi.Dtos.Pasajero;
using VuelosApi.Models;
using VuelosApi.Repositories;

namespace VuelosApi.Services;

public class PasajerosService
{
    private readonly Repository<Pasajero> _repositorio;

    public PasajerosService(Repository<Pasajero> repositorio)
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
        bool existe = await _repositorio.Consultar().AnyAsync(p => p.DNI == dto.DNI);
        if (existe)
            throw new InvalidOperationException("Ya existe un pasajero registrado con ese DNI.");

        var pasajero = new Pasajero
        {
            Nombre = dto.Nombre,
            Apellido = dto.Apellido,
            DNI = dto.DNI,
            Email = dto.Email,
            Telefono = dto.Telefono
        };

        await _repositorio.AgregarAsync(pasajero);
        await _repositorio.GuardarCambiosAsync();
        return ConvertirADTO(pasajero);
    }

    public async Task<bool> EliminarAsync(int id)
    {
        var pasajero = await _repositorio.Consultar()
            .Include(p => p.Reservas)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (pasajero == null) return false;
        if (pasajero.Reservas.Any(r => r.Estado == Enums.EstadoReserva.Confirmada))
            throw new InvalidOperationException("No se puede eliminar un pasajero que tiene reservas confirmadas.");

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
