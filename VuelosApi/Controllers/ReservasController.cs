using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VuelosApi.Dtos;
using VuelosApi.Dtos.Reserva;
using VuelosApi.Exceptions;
using VuelosApi.Services;

namespace VuelosApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class ReservasController : ControllerBase
{
    private readonly IReservaService _servicio;

    public ReservasController(IReservaService servicio)
    {
        _servicio = servicio;
    }

    // El id del usuario sale del token (claim "Id", o NameIdentifier como respaldo), nunca del body.
    private int UsuarioId =>
        int.TryParse(User.FindFirstValue("Id") ?? User.FindFirstValue(ClaimTypes.NameIdentifier), out int id)
            ? id
            : 0;

    private bool EsAdministrador => User.IsInRole("Administrador");

    // D3: Usuario -> sus reservas. Administrador -> todas.
    // Filtros opcionales ?estado=0&vueloId=3 y paginación opcional ?pagina=1&tamanio=10.
    // El cuerpo sigue siendo una lista; el total (con filtros, sin paginar) va en X-Total-Count.
    [HttpGet]
    [ProducesResponseType(typeof(List<ReservaDTO>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ObtenerTodas([FromQuery] FiltroReservas filtro, [FromQuery] ParametrosPaginacion paginacion)
    {
        var resultado = await _servicio.ObtenerTodasAsync(UsuarioId, EsAdministrador, filtro, paginacion);
        Response.Headers["X-Total-Count"] = resultado.Total.ToString();
        return Ok(resultado.Items);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ReservaDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        try
        {
            var reserva = await _servicio.ObtenerPorIdAsync(id, UsuarioId, EsAdministrador);
            if (reserva == null) return ReservaNoEncontrada();
            return Ok(reserva);
        }
        catch (UnauthorizedAccessException error)
        {
            return SinPermiso(error);
        }
    }

    [HttpPost]
    [ProducesResponseType(typeof(ReservaDTO), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Crear([FromBody] CrearReservaDTO dto)
    {
        if (UsuarioId <= 0)
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "No autenticado",
                detail: "No se pudo identificar al usuario.");

        try
        {
            var reserva = await _servicio.CrearAsync(dto, UsuarioId, EsAdministrador);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = reserva.Id }, reserva);
        }
        catch (KeyNotFoundException error)
        {
            return Problem(statusCode: StatusCodes.Status404NotFound, title: "No encontrado", detail: error.Message);
        }
        catch (ConflictoException error)
        {
            return Conflicto(error);
        }
        catch (UnauthorizedAccessException error)
        {
            // Por ejemplo, un usuario común que manda pasajeroId.
            return SinPermiso(error);
        }
    }

    // D2: cancelación lógica (la reserva pasa a "Cancelada" y el asiento queda libre).
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Cancelar(int id)
    {
        try
        {
            bool cancelada = await _servicio.CancelarAsync(id, UsuarioId, EsAdministrador);
            if (!cancelada) return ReservaNoEncontrada();
            return NoContent();
        }
        catch (UnauthorizedAccessException error)
        {
            return SinPermiso(error);
        }
        catch (ConflictoException error)
        {
            return Conflicto(error);
        }
    }

    // Errores en formato ProblemDetails (contrato 4.4): el frontend muestra el "detail".
    private ObjectResult ReservaNoEncontrada()
    {
        return Problem(statusCode: StatusCodes.Status404NotFound, title: "No encontrado", detail: "Reserva no encontrada.");
    }

    private ObjectResult SinPermiso(UnauthorizedAccessException error)
    {
        return Problem(statusCode: StatusCodes.Status403Forbidden, title: "Sin permiso", detail: error.Message);
    }

    private ObjectResult Conflicto(ConflictoException error)
    {
        return Problem(statusCode: StatusCodes.Status409Conflict, title: "Conflicto", detail: error.Message);
    }
}
