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

    // Nullable + [Required]: si no se envían, responde 400 en lugar de guardar el año 0001.
    [Required(ErrorMessage = "La fecha de salida es obligatoria.")]
    public DateTime? FechaSalida { get; set; }

    [Required(ErrorMessage = "La fecha de llegada es obligatoria.")]
    public DateTime? FechaLlegada { get; set; }

    // Tope de 10.000.000: la columna es numeric(10,2) (máx. 99.999.999,99) y el asiento
    // ejecutivo cobra +50 %, así que el precio pagado nunca desborda la columna.
    [Range(typeof(decimal), "0", "10000000", ErrorMessage = "El precio debe estar entre 0 y 10.000.000.")]
    public decimal Precio { get; set; }

    [Range(1, 500, ErrorMessage = "La cantidad de asientos debe estar entre 1 y 500.")]
    public int CantidadAsientos { get; set; }

    public virtual IEnumerable<ValidationResult> Validate(ValidationContext contexto)
    {
        if (FechaSalida.HasValue && FechaLlegada.HasValue && FechaLlegada <= FechaSalida)
            yield return new ValidationResult(
                "La fecha de llegada debe ser posterior a la salida.",
                new[] { nameof(FechaLlegada) });
    }
}
