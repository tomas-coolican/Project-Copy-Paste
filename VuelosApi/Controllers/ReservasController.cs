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
    private readonly IReservaService _servicio;

    public ReservasController(IReservaService servicio)
    {
        _servicio = servicio;
    }

    // El id del usuario sale del token (claim "Id"), nunca del body
    private int UsuarioId => int.TryParse(User.FindFirst("Id")?.Value, out int id) ? id : 0;
    private bool EsAdministrador => User.IsInRole("Administrador");

    [HttpGet]
    public async Task<IActionResult> ObtenerTodas()
    {
        return Ok(await _servicio.ObtenerTodasAsync(UsuarioId, EsAdministrador));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        try
        {
            var reserva = await _servicio.ObtenerPorIdAsync(id, UsuarioId, EsAdministrador);
            if (reserva == null) return NotFound(new { mensaje = "Reserva no encontrada." });
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
        try
        {
            var reserva = await _servicio.CrearAsync(dto, UsuarioId);
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
        try
        {
            bool cancelada = await _servicio.CancelarAsync(id, UsuarioId, EsAdministrador);
            if (!cancelada) return NotFound(new { mensaje = "Reserva no encontrada." });
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
}
