using Microsoft.EntityFrameworkCore;
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
    public DbSet<Usuario> Usuarios => Set<Usuario>();

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
            .HasDatabaseName("IX_Reservas_AsientoId_Confirmada")
            .IsUnique()
            .HasFilter("[Estado] = 0"); // Solo las reservas Confirmadas (0) bloquean el asiento

        // Un pasajero no puede tener dos reservas confirmadas para el mismo vuelo.
        modelo.Entity<Reserva>()
            .HasIndex(r => new { r.PasajeroId, r.VueloId })
            .HasDatabaseName("IX_Reservas_PasajeroId_VueloId_Confirmada")
            .IsUnique()
            .HasFilter("[Estado] = 0");

        // Permite consultar rápidamente las reservas realizadas por cada usuario.
        modelo.Entity<Reserva>()
            .HasIndex(r => r.UsuarioId);

        modelo.Entity<Vuelo>()
            .HasMany(v => v.Asientos)
            .WithOne(a => a.Vuelo)
            .HasForeignKey(a => a.VueloId)
            .OnDelete(DeleteBehavior.Cascade);

        modelo.Entity<Reserva>()
            .HasOne(r => r.Usuario)
            .WithMany(u => u.Reservas)
            .HasForeignKey(r => r.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

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