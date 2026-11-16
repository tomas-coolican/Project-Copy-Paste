using System.ComponentModel.DataAnnotations;

namespace VuelosApi.Dtos.Reserva;

// Datos del pasajero que viajan dentro de POST /api/reservas.
// Si ya existe un pasajero con ese documento se reutiliza; si no, se crea.
public class PasajeroReservaDTO
{
    [Required(ErrorMessage = "El nombre del pasajero es obligatorio.")]
    [MaxLength(60, ErrorMessage = "El nombre admite hasta 60 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido del pasajero es obligatorio.")]
    [MaxLength(60, ErrorMessage = "El apellido admite hasta 60 caracteres.")]
    public string Apellido { get; set; } = string.Empty;

    [Required(ErrorMessage = "El documento del pasajero es obligatorio.")]
    [RegularExpression(@"^\s*[A-Za-z0-9]{6,20}\s*$",
        ErrorMessage = "El documento debe tener entre 6 y 20 letras o números, sin puntos ni espacios.")]
    public string Documento { get; set; } = string.Empty;
}
