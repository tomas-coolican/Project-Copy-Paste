namespace VuelosApi.Models;

// Esqueleto inicial para establecer la relación con Reserva.
// Alex debe completar esta entidad con los datos de autenticación y el rol.
public class Usuario
{
    public int Id { get; set; }

    public List<Reserva> Reservas { get; set; } = new();
}
