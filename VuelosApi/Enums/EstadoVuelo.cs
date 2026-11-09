using System.Text.Json.Serialization;

namespace VuelosApi.Enums;

// Se serializa como texto ("Programado") y no como número.
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EstadoVuelo
{
    Programado = 0,
    EnVuelo = 1,
    Cancelado = 2,
    Finalizado = 3
}
