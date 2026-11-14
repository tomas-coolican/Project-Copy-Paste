using Microsoft.AspNetCore.Mvc;
using VuelosApi.Dtos.Pasajero;
using VuelosApi.Services;

namespace VuelosApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PasajerosController : ControllerBase
{
    private readonly PasajerosService _servicio;

    public PasajerosController(PasajerosService servicio)
    {
        _servicio = servicio;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTodos()
    {
        return Ok(await _servicio.ObtenerTodosAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var pasajero = await _servicio.ObtenerPorIdAsync(id);
        if (pasajero == null) return NotFound(new { mensaje = "Pasajero no encontrado." });
        return Ok(pasajero);
    }

    [HttpPost]
    public async Task<IActionResult> Crear(CrearPasajeroDTO dto)
    {
        try
        {
            var pasajero = await _servicio.CrearAsync(dto);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = pasajero.Id }, pasajero);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        try
        {
            bool eliminado = await _servicio.EliminarAsync(id);
            if (!eliminado) return NotFound(new { mensaje = "Pasajero no encontrado." });
            return Ok(new { mensaje = "Pasajero eliminado correctamente." });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }
}
