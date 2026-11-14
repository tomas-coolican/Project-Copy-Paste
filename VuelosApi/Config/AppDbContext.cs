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

        modelo.Entity<Vuelo>().HasIndex(v => v.NumeroVuelo).IsUnique();
        modelo.Entity<Usuario>().HasIndex(u => u.Email).IsUnique();
        modelo.Entity<Pasajero>().HasIndex(p => p.DNI).IsUnique();
        modelo.Entity<Asiento>().HasIndex(a => new { a.VueloId, a.Numero }).IsUnique();

        // Estado = 0 es Confirmada. Un asiento y un pasajero (por vuelo)
        // solo pueden tener una reserva confirmada.
        modelo.Entity<Reserva>()
            .HasIndex(r => r.AsientoId)
            .IsUnique()
            .HasFilter("\"Estado\" = 0");

        modelo.Entity<Reserva>()
            .HasIndex(r => new { r.PasajeroId, r.VueloId })
            .IsUnique()
            .HasFilter("\"Estado\" = 0");

        modelo.Entity<Reserva>().HasIndex(r => r.UsuarioId);

        // Al borrar un vuelo se borran sus asientos. Con las reservas no se borra nada en cascada.
        modelo.Entity<Vuelo>()
            .HasMany(v => v.Asientos)
            .WithOne(a => a.Vuelo)
            .HasForeignKey(a => a.VueloId)
            .OnDelete(DeleteBehavior.Cascade);

        modelo.Entity<Reserva>()
            .HasOne(r => r.Usuario).WithMany(u => u.Reservas)
            .HasForeignKey(r => r.UsuarioId).OnDelete(DeleteBehavior.Restrict);

        modelo.Entity<Reserva>()
            .HasOne(r => r.Pasajero).WithMany(p => p.Reservas)
            .HasForeignKey(r => r.PasajeroId).OnDelete(DeleteBehavior.Restrict);

        modelo.Entity<Reserva>()
            .HasOne(r => r.Vuelo).WithMany(v => v.Reservas)
            .HasForeignKey(r => r.VueloId).OnDelete(DeleteBehavior.Restrict);

        modelo.Entity<Reserva>()
            .HasOne(r => r.Asiento).WithMany(a => a.Reservas)
            .HasForeignKey(r => r.AsientoId).OnDelete(DeleteBehavior.Restrict);

        modelo.Entity<Vuelo>().Property(v => v.PrecioBase).HasPrecision(10, 2);
        modelo.Entity<Reserva>().Property(r => r.PrecioPagado).HasPrecision(10, 2);
    }
}
