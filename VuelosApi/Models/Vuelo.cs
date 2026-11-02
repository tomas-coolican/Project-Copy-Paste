using System.ComponentModel.DataAnnotations;
using VuelosApi.Enums;

namespace VuelosApi.Models;

public class Vuelo
{
    public int Id { get; set; }

    [Required, MaxLength(20)]
    public string NumeroVuelo { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    public string Origen { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    public string Destino { get; set; } = string.Empty;

    public DateTime FechaSalida { get; set; }
    public DateTime FechaLlegada { get; set; }

    [Range(1, 500)]
    public int Capacidad { get; set; }

    public decimal PrecioBase { get; set; }
    public EstadoVuelo Estado { get; set; } = EstadoVuelo.Programado;

    public List<Asiento> Asientos { get; set; } = new();
    public List<Reserva> Reservas { get; set; } = new();
}
