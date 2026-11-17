using System.Globalization;
using System.Text.RegularExpressions;
using VuelosApi.Dtos.Reserva;
using VuelosApi.Enums;
using VuelosApi.Exceptions;
using VuelosApi.Models;
using VuelosApi.Repositories;

namespace VuelosApi.Services;

// Reglas de negocio de las reservas. No accede a EF Core: todo pasa por IReservaRepository.
// Errores que lanza (los traduce ReservasController):
//   KeyNotFoundException        -> 404 (vuelo o asiento inexistente)
//   UnauthorizedAccessException -> 403 (reserva de otro usuario, o pasajeroId sin ser Administrador)
//   ConflictoException          -> 409 (asiento ocupado, duplicado, vuelo no reservable, etc.)
public class ReservaService : IReservaService
{
    private readonly IReservaRepository _repositorio;

    public ReservaService(IReservaRepository repositorio)
    {
        _repositorio = repositorio;
    }

    public async Task<List<ReservaDTO>> ObtenerTodasAsync(int usuarioId, bool esAdministrador)
    {
        // D3: el Usuario ve solo las suyas; el Administrador ve todas.
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

    public async Task<ReservaDTO> CrearAsync(CrearReservaDTO dto, int usuarioId, bool esAdministrador)
    {
        if (usuarioId <= 0)
            throw new UnauthorizedAccessException("No se pudo identificar al usuario.");

        // Privacidad: con un pasajeroId cualquiera, un usuario podría reservar a nombre de un pasajero
        // que no cargó y ver su nombre y documento en la respuesta. Solo el Administrador lo usa
        // ("Pasajero existente"); el resto manda los datos del pasajero y se busca por documento.
        if (dto.PasajeroId.HasValue && !esAdministrador)
            throw new UnauthorizedAccessException(
                "Solo un administrador puede reservar eligiendo un pasajero existente. Cargá los datos del pasajero.");

        // 1. El vuelo debe existir, estar programado y no haber salido.
        var vuelo = await _repositorio.ObtenerVueloPorIdAsync(dto.VueloId);
        if (vuelo == null)
            throw new KeyNotFoundException("El vuelo indicado no existe.");

        if (vuelo.Estado != EstadoVuelo.Programado)
            throw new ConflictoException("Solo se pueden reservar vuelos programados.");

        if (vuelo.FechaSalida <= DateTime.UtcNow)
            throw new ConflictoException("No se puede reservar un vuelo que ya salió.");

        // 2. El asiento debe existir y pertenecer a ese vuelo.
        var asiento = await _repositorio.ObtenerAsientoPorIdYVueloAsync(dto.AsientoId, dto.VueloId);
        if (asiento == null)
            throw new KeyNotFoundException("El asiento no existe o no pertenece a ese vuelo.");

        // 3. Disponibilidad: un asiento no puede tener dos reservas confirmadas.
        if (await _repositorio.ExisteReservaActivaPorAsientoAsync(dto.AsientoId))
            throw new ConflictoException($"El asiento {asiento.Numero} ya está reservado.");

        // 4. Pasajero: existente por id, o por documento (si no existe, se crea con la reserva).
        Pasajero pasajero;
        if (dto.PasajeroId.HasValue)
        {
            pasajero = await _repositorio.ObtenerPasajeroPorIdAsync(dto.PasajeroId.Value)
                ?? throw new KeyNotFoundException("El pasajero indicado no existe.");
        }
        else
        {
            pasajero = await ObtenerOCrearPasajeroAsync(dto.Pasajero!);
        }

        // 5. Duplicado: el mismo pasajero no puede tener dos reservas confirmadas en el mismo vuelo.
        if (pasajero.Id > 0 &&
            await _repositorio.ExisteReservaActivaPorPasajeroYVueloAsync(pasajero.Id, dto.VueloId))
            throw new ConflictoException(
                $"El pasajero con documento {pasajero.DNI} ya tiene una reserva confirmada para este vuelo.");

        decimal precio = vuelo.PrecioBase;
        if (asiento.Categoria == CategoriaAsiento.Ejecutivo)
            precio *= 1.5m;

        var reserva = new Reserva
        {
            UsuarioId = usuarioId,
            Pasajero = pasajero,
            VueloId = vuelo.Id,
            AsientoId = asiento.Id,
            FechaReserva = DateTime.UtcNow,
            Estado = EstadoReserva.Confirmada,
            PrecioPagado = precio
        };

        await _repositorio.AgregarAsync(reserva);

        // Si otra solicitud ocupa el asiento al mismo tiempo, el índice único de la base
        // lo rechaza y el repositorio lo traduce a ConflictoException (409).
        await _repositorio.GuardarCambiosAsync();

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
            throw new ConflictoException("La reserva ya está cancelada.");

        // Una vez que el vuelo salió, la reserva ya se usó: no se puede cancelar.
        if (reserva.Vuelo != null && reserva.Vuelo.FechaSalida <= DateTime.UtcNow)
            throw new ConflictoException("No se puede cancelar la reserva de un vuelo que ya salió.");

        // D2: cancelación lógica. No se borra, solo cambia el estado.
        // El asiento queda libre porque ya no tiene una reserva confirmada (D5).
        reserva.Estado = EstadoReserva.Cancelada;
        await _repositorio.GuardarCambiosAsync();

        return true;
    }

    private async Task<Pasajero> ObtenerOCrearPasajeroAsync(PasajeroReservaDTO datos)
    {
        string documento = datos.Documento.Trim().ToUpperInvariant();
        string nombre = datos.Nombre.Trim();
        string apellido = datos.Apellido.Trim();

        var existente = await _repositorio.ObtenerPasajeroPorDniAsync(documento);
        if (existente != null)
        {
            // Un documento identifica a una sola persona: si los datos no coinciden, no se reserva
            // a nombre de otra persona. El mensaje es genérico a propósito: no muestra el nombre
            // registrado, para que nadie pueda averiguar de quién es un documento.
            if (!MismoNombre(existente.Nombre, nombre) || !MismoNombre(existente.Apellido, apellido))
                throw new ConflictoException(
                    "No pudimos validar los datos del pasajero. Revisá que el nombre, el apellido y el documento sean correctos.");

            return existente;
        }

        var nuevo = new Pasajero
        {
            Nombre = nombre,
            Apellido = apellido,
            DNI = documento,
            // El email es opcional en la reserva, pero la columna es obligatoria en la base:
            // si no llega se guarda vacío (ver informe: pendiente migración para hacerla opcional).
            Email = string.IsNullOrWhiteSpace(datos.Email) ? string.Empty : datos.Email.Trim(),
            Telefono = string.IsNullOrWhiteSpace(datos.Telefono) ? null : datos.Telefono.Trim()
        };

        await _repositorio.AgregarPasajeroAsync(nuevo);
        return nuevo;
    }

    // Compara nombres sin tener en cuenta mayúsculas, tildes ni espacios de más:
    // "Ána  Pérez" y "ana perez" se consideran el mismo nombre.
    private static bool MismoNombre(string registrado, string ingresado)
    {
        static string Normalizar(string texto) => Regex.Replace(texto.Trim(), @"\s+", " ");

        return string.Compare(
            Normalizar(registrado),
            Normalizar(ingresado),
            CultureInfo.InvariantCulture,
            CompareOptions.IgnoreCase | CompareOptions.IgnoreNonSpace) == 0;
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
            UsuarioId = reserva.UsuarioId,
            UsuarioNombre = reserva.Usuario?.Nombre ?? string.Empty,
            Vuelo = new ReservaVueloDTO
            {
                Id = reserva.VueloId,
                Codigo = reserva.Vuelo?.NumeroVuelo ?? string.Empty,
                Origen = reserva.Vuelo?.Origen ?? string.Empty,
                Destino = reserva.Vuelo?.Destino ?? string.Empty,
                FechaSalida = reserva.Vuelo?.FechaSalida ?? default,
                FechaLlegada = reserva.Vuelo?.FechaLlegada ?? default
            },
            Asiento = new ReservaAsientoDTO
            {
                Id = reserva.AsientoId,
                Numero = reserva.Asiento?.Numero ?? string.Empty,
                Categoria = reserva.Asiento?.Categoria ?? default
            },
            Pasajero = new ReservaPasajeroDTO
            {
                Nombre = reserva.Pasajero?.Nombre ?? string.Empty,
                Apellido = reserva.Pasajero?.Apellido ?? string.Empty,
                Documento = reserva.Pasajero?.DNI ?? string.Empty
            }
        };
    }
}
