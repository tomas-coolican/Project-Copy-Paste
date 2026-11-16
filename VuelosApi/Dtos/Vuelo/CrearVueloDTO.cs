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

        // Solo al crear: no tiene sentido dar de alta un vuelo que ya salió.
        // Al editar sí se permite (por ejemplo, para corregir datos de un vuelo pasado).
        if (FechaSalida.HasValue && FechaSalida.Value.ToUniversalTime() <= DateTime.UtcNow)
            yield return new ValidationResult(
                "La fecha de salida debe ser futura.",
                new[] { nameof(FechaSalida) });

        if (CantidadAsientosEjecutivos < 0 || CantidadAsientosEjecutivos > CantidadAsientos)
            yield return new ValidationResult(
                "La cantidad de asientos ejecutivos no puede superar la cantidad total de asientos.",
                new[] { nameof(CantidadAsientosEjecutivos) });
    }
}
