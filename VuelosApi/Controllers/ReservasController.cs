using Microsoft.AspNetCore.Mvc;
using VuelosApi.Dtos.Reserva;
using VuelosApi.Services;

namespace VuelosApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservasController : ControllerBase
{
    private readonly ReservasService _servicio;

    public ReservasController(ReservasService servicio)
    {
        _servicio = servicio;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTodas()
    {
        return Ok(await _servicio.ObtenerTodasAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var reserva = await _servicio.ObtenerPorIdAsync(id);
        if (reserva == null) return NotFound(new { mensaje = "Reserva no encontrada." });
        return Ok(reserva);
    }

    [HttpPost]
    public async Task<IActionResult> Crear(CrearReservaDTO dto)
    {
        try
        {
            var reserva = await _servicio.CrearAsync(dto);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = reserva.Id }, reserva);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPut("{id:int}/cancelar")]
    public async Task<IActionResult> Cancelar(int id)
    {
        try
        {
            bool cancelada = await _servicio.CancelarAsync(id);
            if (!cancelada) return NotFound(new { mensaje = "Reserva no encontrada." });
            return Ok(new { mensaje = "Reserva cancelada correctamente." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }
}
