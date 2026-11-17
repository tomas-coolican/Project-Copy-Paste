namespace VuelosApi.Dtos;

// Lo que devuelve un servicio paginado: los elementos de la página y el total sin paginar.
// El controller manda Items como cuerpo (sigue siendo una lista) y Total en el header X-Total-Count.
public record ResultadoPaginado<T>(List<T> Items, int Total);
