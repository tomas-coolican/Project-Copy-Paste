using System.ComponentModel.DataAnnotations;

namespace VuelosApi.Dtos.Vuelo;

public class CrearVueloDTO : VueloEntradaDTO
{
    // Opcional (no figura en el contrato): los primeros N asientos se crean como Ejecutivo.
    public int CantidadAsientosEjecutivos { get; set; } = 0;

    public override IEnumerable<ValidationResult> Validate(ValidationContext contexto)
    {
        foreach (var error in base.Validate(contexto))
            yield return error;

        if (CantidadAsientosEjecutivos < 0 || CantidadAsientosEjecutivos > CantidadAsientos)
            yield return new ValidationResult(
                "La cantidad de asientos ejecutivos no puede superar la cantidad total de asientos.",
                new[] { nameof(CantidadAsientosEjecutivos) });
    }
}
