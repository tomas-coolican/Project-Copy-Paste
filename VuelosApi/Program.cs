using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.EntityFrameworkCore;
using VuelosApi.Config;
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

// Conexión a SQL Server, que es el proveedor configurado actualmente en el proyecto.
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
builder.Services.AddScoped(typeof(Repository<>));
builder.Services.AddScoped<VuelosService>();
builder.Services.AddScoped<PasajerosService>();
builder.Services.AddScoped<IReservaService, ReservaService>();
builder.Services.AddScoped<IReservaRepository, ReservaRepository>();
builder.Services.AddScoped<AuthService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// El seed es opcional: solo crea el administrador si se configuraron AdminSeed:Email y AdminSeed:Password.
// La base debe tener aplicada previamente la migración.
using (var scope = app.Services.CreateScope())
{
    var contexto = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await AdminSeeder.CrearAdministradorInicialAsync(contexto, app.Configuration);
}

app.Run();
