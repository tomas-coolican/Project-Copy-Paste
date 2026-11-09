using Microsoft.EntityFrameworkCore;
using VuelosApi.Config;
using VuelosApi.Repositories;
using VuelosApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Controladores y documentación Swagger
builder.Services.AddControllers()
    .AddJsonOptions(opciones =>
    {
        // Las claves de "errors" en las respuestas 400 salen en camelCase (por ejemplo "fechaLlegada").
        opciones.JsonSerializerOptions.DictionaryKeyPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS: origen del frontend en desarrollo (Vite)
const string PoliticaCors = "Frontend";
builder.Services.AddCors(opciones =>
    opciones.AddPolicy(PoliticaCors, politica =>
        politica.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()));

// Conexión a PostgreSQL (Supabase). La contraseña real NO está en el repo:
// se carga con user-secrets (ver README) o con la variable ConnectionStrings__ConexionBaseDatos.
var cadenaConexion = builder.Configuration.GetConnectionString("ConexionBaseDatos")
    ?? throw new InvalidOperationException(
        "Falta la cadena de conexión 'ConexionBaseDatos'. Configurala con user-secrets (ver README).");

builder.Services.AddDbContext<AppDbContext>(opciones =>
    opciones.UseNpgsql(cadenaConexion));

// Repositorio genérico
builder.Services.AddScoped(typeof(Repository<>));

// ---- Módulo Vuelos (Agustín) ----
builder.Services.AddScoped<IVueloRepository, VueloRepository>();
builder.Services.AddScoped<IVueloService, VueloService>();

// ---- Módulo Reservas / Pasajeros (Alex) ----
builder.Services.AddScoped<PasajerosService>();
builder.Services.AddScoped<ReservasService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    // Datos de prueba (requiere haber aplicado las migraciones: dotnet ef database update).
    using var alcance = app.Services.CreateScope();
    try
    {
        DatosDePrueba.Sembrar(alcance.ServiceProvider.GetRequiredService<AppDbContext>());
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "No se cargaron los datos de prueba. ¿Se aplicaron las migraciones?");
    }
}
else
{
    // En desarrollo se evita la redirección a HTTPS para que CORS funcione contra el puerto http.
    app.UseHttpsRedirection();
}

app.UseCors(PoliticaCors);
app.MapControllers();

app.Run();
