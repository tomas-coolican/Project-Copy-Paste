using Microsoft.AspNetCore.Mvc;
using VuelosApi.Dtos.Vuelo;
using VuelosApi.Services;

namespace VuelosApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VuelosController : ControllerBase
{
    private readonly VuelosService _servicio;

    public VuelosController(VuelosService servicio)
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
        var vuelo = await _servicio.ObtenerPorIdAsync(id);
        if (vuelo == null) return NotFound(new { mensaje = "Vuelo no encontrado." });
        return Ok(vuelo);
    }

    [HttpPost]
    public async Task<IActionResult> Crear(CrearVueloDTO dto)
    {
        try
        {
            var vuelo = await _servicio.CrearAsync(dto);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = vuelo.Id }, vuelo);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(int id, ActualizarVueloDTO dto)
    {
        try
        {
            var vuelo = await _servicio.ActualizarAsync(id, dto);
            if (vuelo == null) return NotFound(new { mensaje = "Vuelo no encontrado." });
            return Ok(vuelo);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        try
        {
            bool eliminado = await _servicio.EliminarAsync(id);
            if (!eliminado) return NotFound(new { mensaje = "Vuelo no encontrado." });
            return Ok(new { mensaje = "Vuelo eliminado correctamente." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }
}
