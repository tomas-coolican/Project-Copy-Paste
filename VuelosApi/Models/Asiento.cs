using System.ComponentModel.DataAnnotations;
using VuelosApi.Enums;

namespace VuelosApi.Models;

public class Asiento
{
    public int Id { get; set; }

    [Required, MaxLength(5)]
    public string Numero { get; set; } = string.Empty;

    public CategoriaAsiento Categoria { get; set; }
    public int VueloId { get; set; }
    public Vuelo? Vuelo { get; set; }

    public List<Reserva> Reservas { get; set; } = new();
}
