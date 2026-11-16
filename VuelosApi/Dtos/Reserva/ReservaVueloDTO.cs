namespace VuelosApi.Dtos.Reserva;

// Datos del vuelo dentro de la respuesta de una reserva (contrato 4.5).
public class ReservaVueloDTO
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Origen { get; set; } = string.Empty;
    public string Destino { get; set; } = string.Empty;
    public DateTime FechaSalida { get; set; }
    public DateTime FechaLlegada { get; set; }
}