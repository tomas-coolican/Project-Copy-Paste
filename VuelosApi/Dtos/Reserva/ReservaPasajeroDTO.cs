namespace VuelosApi.Dtos.Reserva;

// Datos del pasajero dentro de la respuesta de una reserva (contrato 4.5).
public class ReservaPasajeroDTO
{
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string Documento { get; set; } = string.Empty;
}
