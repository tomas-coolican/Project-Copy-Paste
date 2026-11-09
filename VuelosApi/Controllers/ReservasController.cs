using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VuelosApi.Dtos.Reserva;
using VuelosApi.Services;

namespace VuelosApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReservasController : ControllerBase
{
    private const string RolAdministrador = "Administrador";
    private readonly IReservaService _servicio;

    public ReservasController(IReservaService servicio)
    {
        _servicio = servicio;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTodas()
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized(new { mensaje = "El token no contiene un identificador de usuario válido." });

        bool esAdministrador = User.IsInRole(RolAdministrador);
        var reservas = await _servicio.ObtenerTodasAsync(usuarioId, esAdministrador);
        return Ok(reservas);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized(new { mensaje = "El token no contiene un identificador de usuario válido." });

        try
        {
            bool esAdministrador = User.IsInRole(RolAdministrador);
            var reserva = await _servicio.ObtenerPorIdAsync(id, usuarioId, esAdministrador);

            if (reserva == null)
                return NotFound(new { mensaje = "Reserva no encontrada." });

            return Ok(reserva);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearReservaDTO dto)
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized(new { mensaje = "El token no contiene un identificador de usuario válido." });

        try
        {
            var reserva = await _servicio.CrearAsync(dto, usuarioId);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = reserva.Id }, reserva);
        }
        catch (KeyNotFoundException error)
        {
            return NotFound(new { mensaje = error.Message });
        }
        catch (InvalidOperationException error)
        {
            return Conflict(new { mensaje = error.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Cancelar(int id)
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized(new { mensaje = "El token no contiene un identificador de usuario válido." });

        try
        {
            bool esAdministrador = User.IsInRole(RolAdministrador);
            bool cancelada = await _servicio.CancelarAsync(id, usuarioId, esAdministrador);

            if (!cancelada)
                return NotFound(new { mensaje = "Reserva no encontrada." });

            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException error)
        {
            return Conflict(new { mensaje = error.Message });
        }
    }

    private bool IntentarObtenerUsuarioId(out int usuarioId)
    {
        // PanaderiaApi agrega el ID numérico en el claim "Id" y usa NameIdentifier para el nombre de usuario. Se conserva esa convención.
        string? id = User.FindFirst("Id")?.Value;

        // Compatibilidad con el acuerdo técnico si Alex decide guardar el ID numérico directamente en NameIdentifier.
        if (string.IsNullOrWhiteSpace(id) || !int.TryParse(id, out usuarioId))
        {
            id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        return int.TryParse(id, out usuarioId) && usuarioId > 0;
    }
}
