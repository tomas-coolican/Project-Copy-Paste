using System.ComponentModel.DataAnnotations;

namespace VuelosApi.Dtos;

// Paginación opcional por query string: ?pagina=2&tamanio=10.
// Si no se manda ninguno de los dos, el listado devuelve todos los elementos (como antes),
// así los clientes que necesitan la lista completa no cambian.
public class ParametrosPaginacion
{
    public const int TamanioPorDefecto = 10;
    public const int TamanioMaximo = 100;

    [Range(1, int.MaxValue, ErrorMessage = "La página debe ser 1 o mayor.")]
    public int? Pagina { get; set; }

    [Range(1, TamanioMaximo, ErrorMessage = "El tamaño de página debe estar entre 1 y 100.")]
    public int? Tamanio { get; set; }

    public bool Activa => Pagina.HasValue || Tamanio.HasValue;

    public int Tomar => Tamanio ?? TamanioPorDefecto;

    public int Saltar => ((Pagina ?? 1) - 1) * Tomar;
}
