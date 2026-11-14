using System.ComponentModel.DataAnnotations;

namespace VuelosApi.Dtos.Auth;

public class RegistroDTO
{
    [Required, MaxLength(80)]
    public string Nombre { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(120)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8), MaxLength(72)]
    public string Password { get; set; } = string.Empty;
}
