using System.Text.Json.Serialization;

namespace VuelosApi.Enums;

// Se serializa como texto ("Turista") y no como número.
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CategoriaAsiento
{
    Turista = 0,
    Ejecutivo = 1
}
