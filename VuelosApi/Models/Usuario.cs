using System.ComponentModel.DataAnnotations;

namespace VuelosApi.Models;

public class Usuario
{
    public int Id { get; set; }

    [Required, MaxLength(80)]
    public string Nombre { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(120)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Rol { get; set; } = "Usuario";

    // Navegación: reservas realizadas por este usuario.
    public List<Reserva> Reservas { get; set; } = new();
}
