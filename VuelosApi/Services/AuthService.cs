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

        bool existe = await _contexto.Usuarios.AnyAsync(u => u.Email == email);
        if (existe)
            throw new InvalidOperationException("Ya existe un usuario registrado con ese email.");

        var usuario = new Usuario
        {
            Nombre = dto.Nombre.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            // El registro público nunca permite elegir el rol.
            Rol = "Usuario"
        };

        _contexto.Usuarios.Add(usuario);
        await _contexto.SaveChangesAsync();

        return CrearRespuesta(usuario);
    }

    public async Task<AuthRespuestaDTO?> IniciarSesionAsync(LoginDTO dto)
    {
        string email = dto.Email.Trim().ToLowerInvariant();
        var usuario = await _contexto.Usuarios.FirstOrDefaultAsync(u => u.Email == email);

        if (usuario == null)
            return null;

        bool passwordCorrecta = BCrypt.Net.BCrypt.Verify(dto.Password, usuario.PasswordHash);
        if (!passwordCorrecta)
            return null;

        return CrearRespuesta(usuario);
    }

    private AuthRespuestaDTO CrearRespuesta(Usuario usuario)
    {
        string? clave = _configuracion["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(clave) || Encoding.UTF8.GetByteCount(clave) < 32)
            throw new InvalidOperationException("Falta configurar Jwt:Key. Debe contener al menos 32 bytes y guardarse en User Secrets o una variable de entorno.");

        string issuer = _configuracion["Jwt:Issuer"] ?? "VuelosApi";
        string audience = _configuracion["Jwt:Audience"] ?? "VuelosApi";
        int minutos = 60;
        if (int.TryParse(_configuracion["Jwt:DuracionMinutos"], out int minutosConfigurados)
            && minutosConfigurados > 0 && minutosConfigurados <= 1440)
        {
            minutos = minutosConfigurados;
        }

        DateTime expira = DateTime.UtcNow.AddMinutes(minutos);

        var claims = new List<Claim>
        {
            // ReservasController obtiene primero el identificador desde el claim "Id".
            new Claim("Id", usuario.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Name, usuario.Nombre),
            new Claim(ClaimTypes.Email, usuario.Email),
            // Claim estándar para que [Authorize(Roles = "...")] y IsInRole funcionen.
            new Claim(ClaimTypes.Role, usuario.Rol)
        };

        var claveSeguridad = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(clave));
        var credenciales = new SigningCredentials(claveSeguridad, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
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
