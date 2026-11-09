using Microsoft.AspNetCore.Mvc;
using VuelosApi.Dtos.Vuelo;
using VuelosApi.Exceptions;
using VuelosApi.Services;

namespace VuelosApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class VuelosController : ControllerBase
{
    private readonly IVueloService _servicio;

    public VuelosController(IVueloService servicio)
    {
        _servicio = servicio;
    }

    // Público (D4 propuesto).
    [HttpGet]
    [ProducesResponseType(typeof(List<VueloDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerTodos()
    {
        return Ok(await _servicio.ObtenerTodosAsync());
    }

    // Público (D4 propuesto).
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(VueloDetalleDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var vuelo = await _servicio.ObtenerPorIdAsync(id);
        if (vuelo == null) return VueloNoEncontrado();
        return Ok(vuelo);
    }

    // TODO: [Authorize(Roles = "Administrador")] cuando Ignacio integre la autenticación.
    [HttpPost]
    [ProducesResponseType(typeof(VueloDetalleDTO), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Crear(CrearVueloDTO dto)
    {
        try
        {
            var vuelo = await _servicio.CrearAsync(dto);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = vuelo.Id }, vuelo);
        }
        catch (ConflictoException ex)
        {
            return Conflicto(ex);
        }
    }

    // TODO: [Authorize(Roles = "Administrador")] cuando Ignacio integre la autenticación.
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(VueloDetalleDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Actualizar(int id, ActualizarVueloDTO dto)
    {
        try
        {
            var vuelo = await _servicio.ActualizarAsync(id, dto);
            if (vuelo == null) return VueloNoEncontrado();
            return Ok(vuelo);
        }
        catch (ConflictoException ex)
        {
            return Conflicto(ex);
        }
    }

    // TODO: [Authorize(Roles = "Administrador")] cuando Ignacio integre la autenticación.
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Eliminar(int id)
    {
        try
        {
            bool eliminado = await _servicio.EliminarAsync(id);
            if (!eliminado) return VueloNoEncontrado();
            return NoContent();
        }
        catch (ConflictoException ex)
        {
            return Conflicto(ex);
        }
    }

    // Errores en formato ProblemDetails (contrato 4.4). Cuando se defina el middleware
    // global de errores (D11), estos try/catch pueden pasar a ese middleware.
    private ObjectResult VueloNoEncontrado()
    {
        return Problem(statusCode: StatusCodes.Status404NotFound, title: "No encontrado", detail: "Vuelo no encontrado.");
    }

    private ObjectResult Conflicto(ConflictoException ex)
    {
        return Problem(statusCode: StatusCodes.Status409Conflict, title: "Conflicto", detail: ex.Message);
    }
}
