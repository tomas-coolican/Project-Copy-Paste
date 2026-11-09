namespace VuelosApi.Exceptions;

// Conflicto de negocio (HTTP 409): asiento ocupado, código duplicado, capacidad insuficiente, etc.
// El mensaje se muestra tal cual al usuario (va en el "detail" del ProblemDetails).
public class ConflictoException : Exception
{
    public ConflictoException(string mensaje) : base(mensaje)
    {
    }
}
