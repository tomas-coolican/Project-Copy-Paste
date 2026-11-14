using System.ComponentModel.DataAnnotations;

namespace VuelosApi.Dtos.Auth;

public class LoginDTO
{
    [Required, EmailAddress, MaxLength(120)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
