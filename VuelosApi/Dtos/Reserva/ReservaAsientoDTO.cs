using VuelosApi.Enums;

namespace VuelosApi.Dtos.Reserva;

// Datos del asiento dentro de la respuesta de una reserva (contrato 4.5).
public class ReservaAsientoDTO
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public CategoriaAsiento Categoria { get; set; }
}
