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
builder.Services.AddScoped<ReservasService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.MapControllers();

app.Run();
