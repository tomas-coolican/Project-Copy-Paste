using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using VuelosApi.Config;
using VuelosApi.Dtos.Auth;
using VuelosApi.Models;

namespace VuelosApi.Services;

public class AuthService
{
    private readonly AppDbContext _contexto;
    private readonly IConfiguration _configuracion;

    public AuthService(AppDbContext contexto, IConfiguration configuracion)
    {
        _contexto = contexto;
        _configuracion = configuracion;
    }

    public async Task<AuthRespuestaDTO> RegistrarAsync(RegistroDTO dto)
    {
        string email = dto.Email.Trim().ToLowerInvariant();

        if (await _contexto.Usuarios.AnyAsync(u => u.Email == email))
            throw new InvalidOperationException("Ya existe un usuario registrado con ese email.");

        var usuario = new Usuario
        {
            Nombre = dto.Nombre.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Rol = "Usuario" // el rol no se elige desde el registro
        };

        _contexto.Usuarios.Add(usuario);
        await _contexto.SaveChangesAsync();

        return CrearRespuesta(usuario);
    }

    public async Task<AuthRespuestaDTO?> IniciarSesionAsync(LoginDTO dto)
    {
        string email = dto.Email.Trim().ToLowerInvariant();
        var usuario = await _contexto.Usuarios.FirstOrDefaultAsync(u => u.Email == email);

        if (usuario == null || !BCrypt.Net.BCrypt.Verify(dto.Password, usuario.PasswordHash))
            return null;

        return CrearRespuesta(usuario);
    }

    private AuthRespuestaDTO CrearRespuesta(Usuario usuario)
    {
        string clave = _configuracion["Jwt:Key"]!;
        string issuer = _configuracion["Jwt:Issuer"] ?? "VuelosApi";
        string audience = _configuracion["Jwt:Audience"] ?? "VuelosApi";
        int minutos = _configuracion.GetValue("Jwt:DuracionMinutos", 60);

        DateTime expira = DateTime.UtcNow.AddMinutes(minutos);

        var claims = new[]
        {
            new Claim("Id", usuario.Id.ToString()),
            new Claim(ClaimTypes.Name, usuario.Nombre),
            new Claim(ClaimTypes.Email, usuario.Email),
            new Claim(ClaimTypes.Role, usuario.Rol)
        };

        var credenciales = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(clave)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expira,
            signingCredentials: credenciales);

        return new AuthRespuestaDTO
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            ExpiraEn = expira,
            Usuario = new UsuarioRespuestaDTO
            {
                Id = usuario.Id,
                Nombre = usuario.Nombre,
                Email = usuario.Email,
                Rol = usuario.Rol
            }
        };
    }
}
