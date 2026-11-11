using Microsoft.EntityFrameworkCore;
using VuelosApi.Models;

namespace VuelosApi.Config;

public static class AdminSeeder
{
    // Crea un administrador inicial solo si se configuraron ambos secretos.
    // No modifica cuentas existentes ni permite elegir el rol desde el registro público.
    public static async Task CrearAdministradorInicialAsync(
        AppDbContext contexto,
        IConfiguration configuracion)
    {
        string? emailConfigurado = configuracion["AdminSeed:Email"];
        string? password = configuracion["AdminSeed:Password"];

        if (string.IsNullOrWhiteSpace(emailConfigurado) || string.IsNullOrWhiteSpace(password))
            return;

        if (password.Length < 12)
            throw new InvalidOperationException("La contraseña inicial del administrador debe tener al menos 12 caracteres.");

        string email = emailConfigurado.Trim().ToLowerInvariant();
        bool existe = await contexto.Usuarios.AnyAsync(u => u.Email == email);
        if (existe)
            return;

        var administrador = new Usuario
        {
            Nombre = "Administrador",
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Rol = "Administrador"
        };

        contexto.Usuarios.Add(administrador);
        await contexto.SaveChangesAsync();
    }
}
