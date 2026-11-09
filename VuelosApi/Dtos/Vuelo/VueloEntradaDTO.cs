using System.ComponentModel.DataAnnotations;

namespace VuelosApi.Dtos.Vuelo;

// Cuerpo común de POST y PUT /api/vuelos (contrato 4.5).
public class VueloEntradaDTO : IValidatableObject
{
    [Required(ErrorMessage = "El código es obligatorio."), MaxLength(20)]
    public string Codigo { get; set; } = string.Empty;

    [Required(ErrorMessage = "El origen es obligatorio."), MaxLength(80)]
    public string Origen { get; set; } = string.Empty;

    [Required(ErrorMessage = "El destino es obligatorio."), MaxLength(80)]
    public string Destino { get; set; } = string.Empty;

    public DateTime FechaSalida { get; set; }
    public DateTime FechaLlegada { get; set; }

    [Range(typeof(decimal), "0", "100000000", ErrorMessage = "El precio no puede ser negativo.")]
    public decimal Precio { get; set; }

    [Range(1, 500, ErrorMessage = "La cantidad de asientos debe estar entre 1 y 500.")]
    public int CantidadAsientos { get; set; }

    public virtual IEnumerable<ValidationResult> Validate(ValidationContext contexto)
    {
        if (FechaLlegada <= FechaSalida)
            yield return new ValidationResult(
                "La fecha de llegada debe ser posterior a la salida.",
                new[] { nameof(FechaLlegada) });
    }
}
