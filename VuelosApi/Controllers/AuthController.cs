using Microsoft.AspNetCore.Mvc;
using VuelosApi.Dtos.Auth;
using VuelosApi.Services;

namespace VuelosApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _servicio;

    public AuthController(AuthService servicio)
    {
        _servicio = servicio;
    }

    [HttpPost("registro")]
    public async Task<IActionResult> Registrar([FromBody] RegistroDTO dto)
    {
        try
        {
            var respuesta = await _servicio.RegistrarAsync(dto);
            return Ok(respuesta);
        }
        catch (InvalidOperationException error)
        {
            return Conflict(new { mensaje = error.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> IniciarSesion([FromBody] LoginDTO dto)
    {
        var respuesta = await _servicio.IniciarSesionAsync(dto);
        if (respuesta == null)
            return Unauthorized(new { mensaje = "Email o contraseña incorrectos." });

        return Ok(respuesta);
    }
}
