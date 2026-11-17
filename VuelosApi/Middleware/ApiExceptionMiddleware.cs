using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using VuelosApi.Exceptions;

namespace VuelosApi.Middleware;

// Manejo global de errores (D11). Los controllers ya traducen los errores esperados;
// este middleware es la red de seguridad para lo que se escape: lo devuelve como
// ProblemDetails (contrato 4.4) en lugar de una página de error o un 500 sin cuerpo.
public class ApiExceptionMiddleware
{
    private readonly RequestDelegate _siguiente;
    private readonly ILogger<ApiExceptionMiddleware> _logger;

    public ApiExceptionMiddleware(RequestDelegate siguiente, ILogger<ApiExceptionMiddleware> logger)
    {
        _siguiente = siguiente;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext contexto)
    {
        try
        {
            await _siguiente(contexto);
        }
        catch (Exception error) when (!contexto.Response.HasStarted)
        {
            var (estado, titulo, detalle) = error switch
            {
                ConflictoException => (StatusCodes.Status409Conflict, "Conflicto", error.Message),
                KeyNotFoundException => (StatusCodes.Status404NotFound, "No encontrado", error.Message),
                UnauthorizedAccessException => (StatusCodes.Status403Forbidden, "Sin permiso", error.Message),
                DbUpdateException dbError when EsConflictoDeIntegridad(dbError) =>
                    (StatusCodes.Status409Conflict, "Conflicto",
                        "La operación entra en conflicto con un registro existente o relacionado."),
                _ => (StatusCodes.Status500InternalServerError, "Error interno",
                    "Ocurrió un error inesperado en el servidor.")
            };

            if (estado >= 500)
                _logger.LogError(error, "Error no controlado en {Ruta}", contexto.Request.Path);
            else
                _logger.LogInformation("Solicitud rechazada en {Ruta}: {Detalle}", contexto.Request.Path, detalle);

            contexto.Response.Clear();
            contexto.Response.StatusCode = estado;
            contexto.Response.ContentType = "application/problem+json";

            var problema = new ProblemDetails
            {
                Status = estado,
                Title = titulo,
                Detail = detalle,
                Instance = contexto.Request.Path
            };
            problema.Extensions["traceId"] = contexto.TraceIdentifier;

            await JsonSerializer.SerializeAsync(
                contexto.Response.Body,
                problema,
                new JsonSerializerOptions(JsonSerializerDefaults.Web),
                contexto.RequestAborted);
        }
    }

    // Violación de índice único o de clave foránea en PostgreSQL.
    private static bool EsConflictoDeIntegridad(DbUpdateException error)
    {
        for (Exception? interna = error.InnerException; interna != null; interna = interna.InnerException)
        {
            if (interna is PostgresException postgres &&
                (postgres.SqlState == PostgresErrorCodes.UniqueViolation ||
                 postgres.SqlState == PostgresErrorCodes.ForeignKeyViolation))
                return true;
        }

        return false;
    }
}
