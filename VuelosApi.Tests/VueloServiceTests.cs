using VuelosApi.Dtos;
using VuelosApi.Dtos.Vuelo;
using VuelosApi.Enums;
using VuelosApi.Exceptions;
using VuelosApi.Models;
using VuelosApi.Services;
using VuelosApi.Tests.Fakes;

namespace VuelosApi.Tests;

// Reglas de negocio de VueloService: asientos, capacidad, estados y paginación.
public class VueloServiceTests
{
    private readonly RepositorioVuelosFalso _repo = new();
    private readonly VueloService _servicio;

    public VueloServiceTests()
    {
        _servicio = new VueloService(_repo);
    }

    private static CrearVueloDTO NuevoVuelo(string codigo = "AR5000", int asientos = 10, int ejecutivos = 0)
    {
        var salida = Datos.EnDias(7);
        return new CrearVueloDTO
        {
            Codigo = codigo,
            Origen = "Buenos Aires",
            Destino = "Mendoza",
            FechaSalida = salida,
            FechaLlegada = salida.AddHours(2),
            Precio = 50000m,
            CantidadAsientos = asientos,
            CantidadAsientosEjecutivos = ejecutivos
        };
    }

    private static ActualizarVueloDTO Edicion(Vuelo vuelo, int? asientos = null, EstadoVuelo? estado = null) => new()
    {
        Codigo = vuelo.NumeroVuelo,
        Origen = vuelo.Origen,
        Destino = vuelo.Destino,
        FechaSalida = vuelo.FechaSalida,
        FechaLlegada = vuelo.FechaLlegada,
        Precio = vuelo.PrecioBase,
        CantidadAsientos = asientos ?? vuelo.Asientos.Count,
        Estado = estado
    };

    private Reserva Reservar(Vuelo vuelo, string numeroAsiento, EstadoReserva estado = EstadoReserva.Confirmada)
    {
        var asiento = vuelo.Asientos.Single(a => a.Numero == numeroAsiento);
        return Datos.Reserva(vuelo.Reservas.Count + 1, vuelo, asiento,
            Datos.Pasajero(vuelo.Reservas.Count + 1, dni: $"4000000{vuelo.Reservas.Count}"), Datos.Usuario(1), estado);
    }

    // ---------- Crear ----------

    [Fact]
    public async Task Crear_GeneraLosAsientosNumeradosYLosEjecutivosPrimero()
    {
        var detalle = await _servicio.CrearAsync(NuevoVuelo(asientos: 5, ejecutivos: 2));

        Assert.Equal(5, detalle.AsientosTotales);
        Assert.Equal(5, detalle.AsientosDisponibles);
        Assert.Equal(EstadoVuelo.Programado, detalle.Estado);
        Assert.Equal(["01", "02", "03", "04", "05"], detalle.Asientos.Select(a => a.Numero));
        Assert.Equal(2, detalle.Asientos.Count(a => a.Categoria == CategoriaAsiento.Ejecutivo));
        Assert.All(detalle.Asientos.Take(2), a => Assert.Equal(CategoriaAsiento.Ejecutivo, a.Categoria));
    }

    [Fact]
    public async Task Crear_ConCodigoRepetido_LanzaConflicto()
    {
        _repo.Vuelos.Add(Datos.Vuelo(1, codigo: "AR5000"));

        await Assert.ThrowsAsync<ConflictoException>(() => _servicio.CrearAsync(NuevoVuelo("AR5000")));
        Assert.Single(_repo.Vuelos);
    }

    // ---------- Actualizar ----------

    [Fact]
    public async Task Actualizar_AumentandoLaCapacidad_AgregaAsientosTuristaQueContinuanLaNumeracion()
    {
        var vuelo = Datos.Vuelo(1, asientos: 4, ejecutivos: 1);
        _repo.Vuelos.Add(vuelo);

        var detalle = await _servicio.ActualizarAsync(1, Edicion(vuelo, asientos: 6));

        Assert.NotNull(detalle);
        Assert.Equal(6, detalle.AsientosTotales);
        Assert.Equal(["05", "06"], detalle.Asientos.Skip(4).Select(a => a.Numero));
        Assert.All(detalle.Asientos.Skip(4), a => Assert.Equal(CategoriaAsiento.Turista, a.Categoria));
    }

    [Fact]
    public async Task Actualizar_ReduciendoSinReservas_QuitaLosUltimosAsientos()
    {
        var vuelo = Datos.Vuelo(1, asientos: 6);
        _repo.Vuelos.Add(vuelo);

        var detalle = await _servicio.ActualizarAsync(1, Edicion(vuelo, asientos: 4));

        Assert.Equal(["01", "02", "03", "04"], detalle!.Asientos.Select(a => a.Numero));
    }

    [Fact]
    public async Task Actualizar_ReduciendoUnAsientoReservado_LanzaConflicto()
    {
        var vuelo = Datos.Vuelo(1, asientos: 6);
        _repo.Vuelos.Add(vuelo);
        Reservar(vuelo, "06");

        var error = await Assert.ThrowsAsync<ConflictoException>(
            () => _servicio.ActualizarAsync(1, Edicion(vuelo, asientos: 4)));

        Assert.Contains("06", error.Message);
        Assert.Equal(6, vuelo.Asientos.Count);
    }

    [Fact]
    public async Task Actualizar_ReduciendoPorDebajoDeLasReservasActivas_LanzaConflicto()
    {
        var vuelo = Datos.Vuelo(1, asientos: 4);
        _repo.Vuelos.Add(vuelo);
        Reservar(vuelo, "01");
        Reservar(vuelo, "02");
        Reservar(vuelo, "03");

        await Assert.ThrowsAsync<ConflictoException>(() => _servicio.ActualizarAsync(1, Edicion(vuelo, asientos: 2)));
    }

    [Fact]
    public async Task Actualizar_ACancelado_CancelaLasReservasConfirmadas()
    {
        var vuelo = Datos.Vuelo(1, asientos: 4);
        _repo.Vuelos.Add(vuelo);
        var r1 = Reservar(vuelo, "01");
        var r2 = Reservar(vuelo, "02");

        var detalle = await _servicio.ActualizarAsync(1, Edicion(vuelo, estado: EstadoVuelo.Cancelado));

        Assert.Equal(EstadoVuelo.Cancelado, detalle!.Estado);
        Assert.Equal(EstadoReserva.Cancelada, r1.Estado);
        Assert.Equal(EstadoReserva.Cancelada, r2.Estado);
        Assert.Equal(4, detalle.AsientosDisponibles);
    }

    [Fact]
    public async Task Actualizar_ConCodigoDeOtroVuelo_LanzaConflicto()
    {
        var vuelo = Datos.Vuelo(1, codigo: "AR1000");
        _repo.Vuelos.AddRange([vuelo, Datos.Vuelo(2, codigo: "AR2000")]);
        var edicion = Edicion(vuelo);
        edicion.Codigo = "AR2000";

        await Assert.ThrowsAsync<ConflictoException>(() => _servicio.ActualizarAsync(1, edicion));
    }

    [Fact]
    public async Task Actualizar_VueloInexistente_DevuelveNull()
    {
        Assert.Null(await _servicio.ActualizarAsync(99, Edicion(Datos.Vuelo(99))));
    }

    // ---------- Eliminar ----------

    [Fact]
    public async Task Eliminar_VueloSinReservas_LoBorra()
    {
        _repo.Vuelos.Add(Datos.Vuelo(1));

        Assert.True(await _servicio.EliminarAsync(1));
        Assert.Empty(_repo.Vuelos);
    }

    [Fact]
    public async Task Eliminar_VueloConReservasAunqueEstenCanceladas_LanzaConflicto()
    {
        var vuelo = Datos.Vuelo(1);
        _repo.Vuelos.Add(vuelo);
        Reservar(vuelo, "01", EstadoReserva.Cancelada);

        await Assert.ThrowsAsync<ConflictoException>(() => _servicio.EliminarAsync(1));
        Assert.Single(_repo.Vuelos);
    }

    // ---------- Consultar ----------

    [Fact]
    public async Task ObtenerPorId_CuentaLosAsientosDisponibles()
    {
        var vuelo = Datos.Vuelo(1, asientos: 4);
        _repo.Vuelos.Add(vuelo);
        Reservar(vuelo, "01");
        Reservar(vuelo, "02", EstadoReserva.Cancelada); // cancelada: el asiento queda libre

        var detalle = await _servicio.ObtenerPorIdAsync(1);

        Assert.Equal(3, detalle!.AsientosDisponibles);
        Assert.False(detalle.Asientos.Single(a => a.Numero == "01").Disponible);
        Assert.True(detalle.Asientos.Single(a => a.Numero == "02").Disponible);
    }

    [Fact]
    public async Task ObtenerPorId_EstadoSegunElHorario()
    {
        var enVuelo = Datos.Vuelo(1, salida: DateTime.UtcNow.AddHours(-1));          // llega en 1 h
        var finalizado = Datos.Vuelo(2, codigo: "AR2000", salida: Datos.EnDias(-1));
        var cancelado = Datos.Vuelo(3, codigo: "AR3000", salida: Datos.EnDias(-1), estado: EstadoVuelo.Cancelado);
        _repo.Vuelos.AddRange([enVuelo, finalizado, cancelado]);

        Assert.Equal(EstadoVuelo.EnVuelo, (await _servicio.ObtenerPorIdAsync(1))!.Estado);
        Assert.Equal(EstadoVuelo.Finalizado, (await _servicio.ObtenerPorIdAsync(2))!.Estado);
        Assert.Equal(EstadoVuelo.Cancelado, (await _servicio.ObtenerPorIdAsync(3))!.Estado);
    }

    [Fact]
    public async Task ObtenerTodos_SinPaginacion_DevuelveTodosOrdenadosPorSalida()
    {
        _repo.Vuelos.AddRange([
            Datos.Vuelo(1, "AR1", Datos.EnDias(3)),
            Datos.Vuelo(2, "AR2", Datos.EnDias(1)),
            Datos.Vuelo(3, "AR3", Datos.EnDias(2))
        ]);

        var resultado = await _servicio.ObtenerTodosAsync(new ParametrosPaginacion());

        Assert.Equal(3, resultado.Total);
        Assert.Equal(["AR2", "AR3", "AR1"], resultado.Items.Select(v => v.Codigo));
    }

    [Fact]
    public async Task ObtenerTodos_ConPaginacion_DevuelveLaPaginaYElTotal()
    {
        for (int i = 1; i <= 12; i++)
            _repo.Vuelos.Add(Datos.Vuelo(i, $"AR{i:D2}", Datos.EnDias(i)));

        var resultado = await _servicio.ObtenerTodosAsync(new ParametrosPaginacion { Pagina = 3, Tamanio = 5 });

        Assert.Equal(12, resultado.Total);
        Assert.Equal(["AR11", "AR12"], resultado.Items.Select(v => v.Codigo));
    }
}
