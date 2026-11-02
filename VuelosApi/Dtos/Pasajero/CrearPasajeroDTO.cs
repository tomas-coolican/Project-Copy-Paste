using System.ComponentModel.DataAnnotations;

namespace VuelosApi.Dtos.Pasajero;

public class CrearPasajeroDTO
{
    [Required, MaxLength(60)]
    public string Nombre { get; set; } = string.Empty;

    [Required, MaxLength(60)]
    public string Apellido { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string DNI { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(120)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Telefono { get; set; }
}
