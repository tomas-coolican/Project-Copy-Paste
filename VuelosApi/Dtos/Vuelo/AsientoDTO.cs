using VuelosApi.Enums;

namespace VuelosApi.Dtos.Vuelo;

public class AsientoDTO
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public CategoriaAsiento Categoria { get; set; }
    public bool Disponible { get; set; }
}
