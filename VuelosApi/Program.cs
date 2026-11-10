using Microsoft.EntityFrameworkCore;
using VuelosApi.Config;
using VuelosApi.Repositories;
using VuelosApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Controladores y documentación Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Conexión a SQL Server
builder.Services.AddDbContext<AppDbContext>(opciones =>
    opciones.UseSqlServer(builder.Configuration.GetConnectionString("ConexionSqlServer")));

// Repositorio genérico
builder.Services.AddScoped(typeof(Repository<>));

// Servicios de la aplicación
builder.Services.AddScoped<VuelosService>();
builder.Services.AddScoped<PasajerosService>();
builder.Services.AddScoped<IReservaService, ReservaService>();

// Repositorio específico del módulo de reservas
builder.Services.AddScoped<IReservaRepository, ReservaRepository>();

// CORS: orígenes permitidos configurables. En desarrollo, Vite usa http://localhost:5173.
var origenesPermitidos = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(opciones =>
{
    opciones.AddPolicy("FrontendPolicy", politica =>
    {
        politica.WithOrigins(origenesPermitidos)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("FrontendPolicy");

app.UseHttpsRedirection();
app.MapControllers();

app.Run();
