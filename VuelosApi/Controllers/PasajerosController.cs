using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VuelosApi.Dtos.Pasajero;
using VuelosApi.Services;

namespace VuelosApi.Controllers;

// Administración de pasajeros: contiene datos personales (DNI, email, teléfono), así que todo el
// controller es solo para Administrador. Un Usuario común no necesita estos endpoints: carga los
// datos del pasajero dentro de POST /api/reservas y el backend lo busca por documento o lo crea.
// (Antes POST /api/pasajeros estaba abierto a cualquier usuario y permitía averiguar si un DNI existía.)
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
[Produces("application/json")]
public class PasajerosController : ControllerBase
{
    private readonly PasajerosService _servicio;

    public PasajerosController(PasajerosService servicio)
    {
        _servicio = servicio;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<PasajeroDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerTodos()
    {
        return Ok(await _servicio.ObtenerTodosAsync());
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(PasajeroDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var pasajero = await _servicio.ObtenerPorIdAsync(id);
        if (pasajero == null) return PasajeroNoEncontrado();
        return Ok(pasajero);
    }

    [HttpPost]
    [ProducesResponseType(typeof(PasajeroDTO), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Crear([FromBody] CrearPasajeroDTO dto)
    {
        try
        {
            var pasajero = await _servicio.CrearAsync(dto);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = pasajero.Id }, pasajero);
        }
        catch (InvalidOperationException error)
        {
            return Conflicto(error);
        }
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Eliminar(int id)
    {
        try
        {
            bool eliminado = await _servicio.EliminarAsync(id);
            if (!eliminado) return PasajeroNoEncontrado();
            return NoContent();
        }
        catch (InvalidOperationException error)
        {
            return Conflicto(error);
        }
    }

    // Errores en formato ProblemDetails (contrato 4.4), igual que el resto de la API.
    private ObjectResult PasajeroNoEncontrado()
    {
        return Problem(statusCode: StatusCodes.Status404NotFound, title: "No encontrado", detail: "Pasajero no encontrado.");
    }

    private ObjectResult Conflicto(InvalidOperationException error)
    {
        return Problem(statusCode: StatusCodes.Status409Conflict, title: "Conflicto", detail: error.Message);
    }
}
