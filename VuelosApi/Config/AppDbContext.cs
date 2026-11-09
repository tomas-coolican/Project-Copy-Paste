using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using VuelosApi.Models;

namespace VuelosApi.Config;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> opciones) : base(opciones)
    {
    }

    public DbSet<Vuelo> Vuelos => Set<Vuelo>();
    public DbSet<Pasajero> Pasajeros => Set<Pasajero>();
    public DbSet<Asiento> Asientos => Set<Asiento>();
    public DbSet<Reserva> Reservas => Set<Reserva>();

    // Todas las fechas se guardan y se leen como UTC. Sin esto, la base devuelve las fechas
    // sin "Kind" y la API las serializa sin la "Z" (el navegador las tomaría como hora local).
    protected override void ConfigureConventions(ModelConfigurationBuilder configuracion)
    {
        configuracion.Properties<DateTime>().HaveConversion<FechaUtcConverter>();
    }

    protected override void OnModelCreating(ModelBuilder modelo)
    {
        base.OnModelCreating(modelo);

        modelo.Entity<Vuelo>()
            .HasIndex(v => v.NumeroVuelo)
            .IsUnique();

        modelo.Entity<Pasajero>()
            .HasIndex(p => p.DNI)
            .IsUnique();

        modelo.Entity<Asiento>()
            .HasIndex(a => new { a.VueloId, a.Numero })
            .IsUnique();

        modelo.Entity<Reserva>()
            .HasIndex(r => r.AsientoId)
            .IsUnique()
            .HasFilter("\"Estado\" = 0"); // Solo las reservas Confirmadas (0) bloquean el asiento

        modelo.Entity<Vuelo>()
            .HasMany(v => v.Asientos)
            .WithOne(a => a.Vuelo)
            .HasForeignKey(a => a.VueloId)
            .OnDelete(DeleteBehavior.Cascade);

        modelo.Entity<Reserva>()
            .HasOne(r => r.Pasajero)
            .WithMany(p => p.Reservas)
            .HasForeignKey(r => r.PasajeroId)
            .OnDelete(DeleteBehavior.Restrict);

        modelo.Entity<Reserva>()
            .HasOne(r => r.Vuelo)
            .WithMany(v => v.Reservas)
            .HasForeignKey(r => r.VueloId)
            .OnDelete(DeleteBehavior.Restrict);

        modelo.Entity<Reserva>()
            .HasOne(r => r.Asiento)
            .WithMany(a => a.Reservas)
            .HasForeignKey(r => r.AsientoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelo.Entity<Vuelo>().Property(v => v.PrecioBase).HasPrecision(10, 2);
        modelo.Entity<Reserva>().Property(r => r.PrecioPagado).HasPrecision(10, 2);
    }
}

public class FechaUtcConverter : ValueConverter<DateTime, DateTime>
{
    public FechaUtcConverter() : base(
        // Al guardar: se normaliza a UTC.
        fecha => fecha.Kind == DateTimeKind.Local
            ? fecha.ToUniversalTime()
            : DateTime.SpecifyKind(fecha, DateTimeKind.Utc),
        // Al leer: se marca como UTC.
        fecha => DateTime.SpecifyKind(fecha, DateTimeKind.Utc))
    {
    }
}
