using Microsoft.EntityFrameworkCore;
using VuelosApi.Models;

namespace VuelosApi.Config;

public static class AdminSeeder
{
    // Crea el administrador si AdminSeed:Email y AdminSeed:Password están configurados
    // y todavía no existe un usuario con ese email.
    public static async Task CrearAdministradorInicialAsync(AppDbContext contexto, IConfiguration configuracion)
    {
        string? emailConfigurado = configuracion["AdminSeed:Email"];
        string? password = configuracion["AdminSeed:Password"];

        if (string.IsNullOrWhiteSpace(emailConfigurado) || string.IsNullOrWhiteSpace(password))
            return;

        if (password.Length < 12)
            throw new InvalidOperationException("La contraseña del administrador debe tener al menos 12 caracteres.");

        string email = emailConfigurado.Trim().ToLowerInvariant();
        if (await contexto.Usuarios.AnyAsync(u => u.Email == email))
            return;

        contexto.Usuarios.Add(new Usuario
        {
            Nombre = "Administrador",
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Rol = "Administrador"
        });
        await contexto.SaveChangesAsync();
    }
}
