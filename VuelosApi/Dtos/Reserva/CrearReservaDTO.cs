using System.ComponentModel.DataAnnotations;

namespace VuelosApi.Dtos.Reserva;

// Cuerpo de POST /api/reservas. El usuarioId no viaja: el backend lo toma del token JWT.
// El pasajero se indica de UNA de estas dos formas (exactamente una):
//   - "pasajero": { nombre, apellido, documento }  -> contrato 4.5 / D1: se busca por documento o se crea.
//   - "pasajeroId": 5                               -> pasajero ya existente (por ejemplo, creado con POST /api/pasajeros).
public class CrearReservaDTO : IValidatableObject
{
    [Range(1, int.MaxValue, ErrorMessage = "Seleccioná un vuelo válido.")]
    public int VueloId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Seleccioná un asiento válido.")]
    public int AsientoId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Seleccioná un pasajero válido.")]
    public int? PasajeroId { get; set; }

    public PasajeroReservaDTO? Pasajero { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext contexto)
    {
        if (PasajeroId is null && Pasajero is null)
            yield return new ValidationResult(
                "Indicá los datos del pasajero.",
                new[] { nameof(Pasajero) });

        if (PasajeroId is not null && Pasajero is not null)
            yield return new ValidationResult(
                "Enviá el pasajero existente (pasajeroId) o los datos de uno nuevo (pasajero), no los dos.",
                new[] { nameof(Pasajero) });
    }
}
