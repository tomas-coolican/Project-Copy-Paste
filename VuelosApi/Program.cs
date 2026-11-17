using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.EntityFrameworkCore;
using VuelosApi.Config;
using VuelosApi.Middleware;
using VuelosApi.Repositories;
using VuelosApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Controladores y documentación Swagger.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(opciones =>
{
    opciones.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Ingresá el token JWT. Swagger agrega automáticamente el prefijo Bearer."
    });

    opciones.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Conexión a PostgreSQL (Supabase) con Npgsql.
builder.Services.AddDbContext<AppDbContext>(opciones =>
    opciones.UseNpgsql(builder.Configuration.GetConnectionString("Supabase")));

// Autenticación JWT: la clave se obtiene de User Secrets o variables de entorno.
string? jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || Encoding.UTF8.GetByteCount(jwtKey) < 32)
    throw new InvalidOperationException("Configurá Jwt:Key mediante User Secrets o la variable de entorno Jwt__Key. Debe tener al menos 32 bytes.");

string jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "VuelosApi";
string jwtAudience = builder.Configuration["Jwt:Audience"] ?? "VuelosApi";

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opciones =>
    {
        opciones.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            NameClaimType = System.Security.Claims.ClaimTypes.Name,
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };
    });

builder.Services.AddAuthorization();

// Repositorios y servicios de la aplicación.
// Vuelos
builder.Services.AddScoped<IVueloRepository, VueloRepository>();
builder.Services.AddScoped<IVueloService, VueloService>();
// Auth
builder.Services.AddScoped<AuthService>();
// Pasajeros y reservas
builder.Services.AddScoped<IPasajeroRepository, PasajeroRepository>();
builder.Services.AddScoped<PasajerosService>();
builder.Services.AddScoped<IReservaRepository, ReservaRepository>();
builder.Services.AddScoped<IReservaService, ReservaService>();

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
            .AllowAnyMethod()
            .WithExposedHeaders("X-Total-Count"); // el frontend lee el total de los listados paginados
    });
});

var app = builder.Build();

// Manejo global de errores: cualquier excepción no controlada sale como ProblemDetails.
app.UseMiddleware<ApiExceptionMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("FrontendPolicy");

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health Check para Render. No requiere conexión con la base de datos.
app.MapGet("/health", () => Results.Ok(new { status = "Healthy" }));


// El seed es opcional: solo crea el administrador si se configuraron AdminSeed:Email y AdminSeed:Password.
// La base debe tener aplicada previamente la migración.
using (var scope = app.Services.CreateScope())
{
    var contexto = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Si la base no responde al arrancar, se avisa en el log pero la API igual levanta
    // (antes se caía entera). Las peticiones fallarán con 500 hasta que vuelva la conexión.
    try
    {
        await AdminSeeder.CrearAdministradorInicialAsync(contexto, app.Configuration);
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "No se pudo crear el administrador inicial. Revisá la conexión a la base.");
    }

    // Vuelos de ejemplo: solo si DatosDePrueba:Cargar es true. Agrega los que falten (por código),
    // así que no duplica nada aunque la tabla ya tenga vuelos.
    if (app.Configuration.GetValue<bool>("DatosDePrueba:Cargar"))
    {
        try
        {
            DatosDePrueba.Sembrar(contexto);
        }
        catch (Exception ex)
        {
            app.Logger.LogWarning(ex, "No se cargaron los datos de prueba de vuelos.");
        }
    }
}

app.Run();