using VuelosApi.Dtos;
using VuelosApi.Dtos.Reserva;
using VuelosApi.Enums;
using VuelosApi.Exceptions;
using VuelosApi.Models;
using VuelosApi.Services;
using VuelosApi.Tests.Fakes;

namespace VuelosApi.Tests;

// Reglas de negocio de ReservaService (Integrante 3: pasajeros y reservas).
public class ReservaServiceTests
{
    private readonly RepositorioReservasFalso _repo = new();
    private readonly ReservaService _servicio;
    private readonly Vuelo _vuelo;
    private readonly Usuario _usuario = Datos.Usuario(1);
    private readonly Usuario _otroUsuario = Datos.Usuario(2);

    public ReservaServiceTests()
    {
        _servicio = new ReservaService(_repo);
        _vuelo = Datos.Vuelo(1, asientos: 6, ejecutivos: 2, precio: 1000m);
        _repo.Vuelos.Add(_vuelo);
        _repo.Usuarios.AddRange([_usuario, _otroUsuario]);
    }

    private Asiento Asiento(string numero) => _vuelo.Asientos.Single(a => a.Numero == numero);

    private static CrearReservaDTO Pedido(int vueloId, int asientoId,
        string nombre = "Ana", string apellido = "Pérez", string documento = "30123456") => new()
    {
        VueloId = vueloId,
        AsientoId = asientoId,
        Pasajero = new PasajeroReservaDTO { Nombre = nombre, Apellido = apellido, Documento = documento }
    };

    private Reserva ReservaGuardada(int id, Asiento asiento, Pasajero pasajero, Usuario usuario,
        EstadoReserva estado = EstadoReserva.Confirmada, DateTime? fecha = null)
    {
        if (!_repo.Pasajeros.Contains(pasajero)) _repo.Pasajeros.Add(pasajero);
        var reserva = Datos.Reserva(id, _vuelo, asiento, pasajero, usuario, estado, fecha);
        _repo.Reservas.Add(reserva);
        return reserva;
    }

    // ---------- Crear ----------

    [Fact]
    public async Task Crear_ConPasajeroNuevo_ConfirmaLaReservaYCreaElPasajero()
    {
        var resultado = await _servicio.CrearAsync(Pedido(1, Asiento("03").Id), _usuario.Id, false);

        Assert.Equal(EstadoReserva.Confirmada, resultado.Estado);
        Assert.Equal(1000m, resultado.PrecioPagado);
        Assert.Equal("03", resultado.Asiento.Numero);
        Assert.Equal("Ana Pérez", resultado.NombrePasajero);
        Assert.Equal(_usuario.Id, resultado.UsuarioId);
        Assert.Single(_repo.Pasajeros);
        Assert.Single(_repo.Reservas);
    }

    [Fact]
    public async Task Crear_EnAsientoEjecutivo_CobraUnCincuentaPorCientoMas()
    {
        var resultado = await _servicio.CrearAsync(Pedido(1, Asiento("01").Id), _usuario.Id, false);

        Assert.Equal(CategoriaAsiento.Ejecutivo, resultado.Asiento.Categoria);
        Assert.Equal(1500m, resultado.PrecioPagado);
    }

    [Fact]
    public async Task Crear_GuardaElDocumentoEnMayusculasYSinEspacios()
    {
        var resultado = await _servicio.CrearAsync(
            Pedido(1, Asiento("03").Id, documento: "  ab123456 "), _usuario.Id, false);

        Assert.Equal("AB123456", resultado.Pasajero.Documento);
    }

    [Fact]
    public async Task Crear_EnAsientoOcupado_LanzaConflicto()
    {
        ReservaGuardada(1, Asiento("03"), Datos.Pasajero(1, dni: "11111111"), _otroUsuario);

        var error = await Assert.ThrowsAsync<ConflictoException>(
            () => _servicio.CrearAsync(Pedido(1, Asiento("03").Id), _usuario.Id, false));

        Assert.Contains("03", error.Message);
    }

    [Fact]
    public async Task Crear_EnAsientoDeUnaReservaCancelada_LoPermite()
    {
        ReservaGuardada(1, Asiento("03"), Datos.Pasajero(1, dni: "11111111"), _otroUsuario, EstadoReserva.Cancelada);

        var resultado = await _servicio.CrearAsync(Pedido(1, Asiento("03").Id), _usuario.Id, false);

        Assert.Equal(EstadoReserva.Confirmada, resultado.Estado);
    }

    [Fact]
    public async Task Crear_ConVueloInexistente_LanzaNoEncontrado()
    {
        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _servicio.CrearAsync(Pedido(99, Asiento("03").Id), _usuario.Id, false));
    }

    [Fact]
    public async Task Crear_ConAsientoDeOtroVuelo_LanzaNoEncontrado()
    {
        var otroVuelo = Datos.Vuelo(2, codigo: "AR2000");
        _repo.Vuelos.Add(otroVuelo);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _servicio.CrearAsync(Pedido(1, otroVuelo.Asientos[0].Id), _usuario.Id, false));
    }

    [Theory]
    [InlineData(EstadoVuelo.Cancelado)]
    [InlineData(EstadoVuelo.Finalizado)]
    [InlineData(EstadoVuelo.EnVuelo)]
    public async Task Crear_EnVueloNoProgramado_LanzaConflicto(EstadoVuelo estado)
    {
        _vuelo.Estado = estado;

        await Assert.ThrowsAsync<ConflictoException>(
            () => _servicio.CrearAsync(Pedido(1, Asiento("03").Id), _usuario.Id, false));
    }

    [Fact]
    public async Task Crear_EnVueloQueYaSalio_LanzaConflicto()
    {
        _vuelo.FechaSalida = Datos.EnDias(-1);

        await Assert.ThrowsAsync<ConflictoException>(
            () => _servicio.CrearAsync(Pedido(1, Asiento("03").Id), _usuario.Id, false));
    }

    [Fact]
    public async Task Crear_SinUsuarioIdentificado_LanzaNoAutorizado()
    {
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _servicio.CrearAsync(Pedido(1, Asiento("03").Id), 0, false));
    }

    [Fact]
    public async Task Crear_ConPasajeroIdSiendoUsuario_LanzaNoAutorizado()
    {
        _repo.Pasajeros.Add(Datos.Pasajero(1));
        var pedido = new CrearReservaDTO { VueloId = 1, AsientoId = Asiento("03").Id, PasajeroId = 1 };

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _servicio.CrearAsync(pedido, _usuario.Id, esAdministrador: false));
        Assert.Empty(_repo.Reservas);
    }

    [Fact]
    public async Task Crear_ConPasajeroIdSiendoAdministrador_UsaEsePasajero()
    {
        _repo.Pasajeros.Add(Datos.Pasajero(1, "Luis", "Gómez", "22222222"));
        var pedido = new CrearReservaDTO { VueloId = 1, AsientoId = Asiento("03").Id, PasajeroId = 1 };

        var resultado = await _servicio.CrearAsync(pedido, _usuario.Id, esAdministrador: true);

        Assert.Equal(1, resultado.PasajeroId);
        Assert.Equal("Luis Gómez", resultado.NombrePasajero);
    }

    [Fact]
    public async Task Crear_ConPasajeroIdInexistente_LanzaNoEncontrado()
    {
        var pedido = new CrearReservaDTO { VueloId = 1, AsientoId = Asiento("03").Id, PasajeroId = 50 };

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _servicio.CrearAsync(pedido, _usuario.Id, esAdministrador: true));
    }

    [Fact]
    public async Task Crear_MismoPasajeroDosVecesEnElMismoVuelo_LanzaConflicto()
    {
        ReservaGuardada(1, Asiento("03"), Datos.Pasajero(1), _usuario);

        await Assert.ThrowsAsync<ConflictoException>(
            () => _servicio.CrearAsync(Pedido(1, Asiento("04").Id), _usuario.Id, false));
    }

    [Fact]
    public async Task Crear_DocumentoExistenteConOtroNombre_LanzaConflictoSinRevelarElNombre()
    {
        _repo.Pasajeros.Add(Datos.Pasajero(1, "Marta", "Suárez", "30123456"));

        var error = await Assert.ThrowsAsync<ConflictoException>(
            () => _servicio.CrearAsync(Pedido(1, Asiento("03").Id, "Ana", "Pérez", "30123456"), _usuario.Id, false));

        Assert.DoesNotContain("Marta", error.Message);
        Assert.DoesNotContain("Suárez", error.Message);
        Assert.Empty(_repo.Reservas);
    }

    [Fact]
    public async Task Crear_DocumentoExistenteConMismoNombreSinTildes_ReutilizaElPasajero()
    {
        _repo.Pasajeros.Add(Datos.Pasajero(1, "Ana", "Pérez", "30123456"));

        var resultado = await _servicio.CrearAsync(
            Pedido(1, Asiento("03").Id, "  ANA ", "perez", "30123456"), _usuario.Id, false);

        Assert.Equal(1, resultado.PasajeroId);
        Assert.Single(_repo.Pasajeros);
    }

    [Fact]
    public async Task Crear_CuandoElIndiceUnicoRechaza_PropagaConflicto()
    {
        _repo.SimularIndiceUnico = true;

        await Assert.ThrowsAsync<ConflictoException>(
            () => _servicio.CrearAsync(Pedido(1, Asiento("03").Id), _usuario.Id, false));
        Assert.Empty(_repo.Reservas);
    }

    // ---------- Cancelar ----------

    [Fact]
    public async Task Cancelar_ReservaPropia_LaMarcaCanceladaYLiberaElAsiento()
    {
        var reserva = ReservaGuardada(1, Asiento("03"), Datos.Pasajero(1), _usuario);

        bool ok = await _servicio.CancelarAsync(reserva.Id, _usuario.Id, false);

        Assert.True(ok);
        Assert.Equal(EstadoReserva.Cancelada, reserva.Estado);
        Assert.Single(_repo.Reservas); // cancelación lógica: no se borra
        Assert.False(await _repo.ExisteReservaActivaPorAsientoAsync(Asiento("03").Id));
    }

    [Fact]
    public async Task Cancelar_ReservaDeOtroUsuario_LanzaNoAutorizado()
    {
        var reserva = ReservaGuardada(1, Asiento("03"), Datos.Pasajero(1), _otroUsuario);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _servicio.CancelarAsync(reserva.Id, _usuario.Id, false));
        Assert.Equal(EstadoReserva.Confirmada, reserva.Estado);
    }

    [Fact]
    public async Task Cancelar_ReservaDeOtroUsuarioSiendoAdministrador_LaCancela()
    {
        var reserva = ReservaGuardada(1, Asiento("03"), Datos.Pasajero(1), _otroUsuario);

        Assert.True(await _servicio.CancelarAsync(reserva.Id, _usuario.Id, esAdministrador: true));
        Assert.Equal(EstadoReserva.Cancelada, reserva.Estado);
    }

    [Fact]
    public async Task Cancelar_ReservaYaCancelada_LanzaConflicto()
    {
        var reserva = ReservaGuardada(1, Asiento("03"), Datos.Pasajero(1), _usuario, EstadoReserva.Cancelada);

        await Assert.ThrowsAsync<ConflictoException>(() => _servicio.CancelarAsync(reserva.Id, _usuario.Id, false));
    }

    [Fact]
    public async Task Cancelar_DeUnVueloQueYaSalio_LanzaConflicto()
    {
        var reserva = ReservaGuardada(1, Asiento("03"), Datos.Pasajero(1), _usuario);
        _vuelo.FechaSalida = Datos.EnDias(-1);

        await Assert.ThrowsAsync<ConflictoException>(() => _servicio.CancelarAsync(reserva.Id, _usuario.Id, false));
    }

    [Fact]
    public async Task Cancelar_ReservaInexistente_DevuelveFalse()
    {
        Assert.False(await _servicio.CancelarAsync(99, _usuario.Id, false));
    }

    // ---------- Consultar ----------

    [Fact]
    public async Task ObtenerPorId_ReservaDeOtroUsuario_LanzaNoAutorizado()
    {
        var reserva = ReservaGuardada(1, Asiento("03"), Datos.Pasajero(1), _otroUsuario);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _servicio.ObtenerPorIdAsync(reserva.Id, _usuario.Id, false));
        Assert.NotNull(await _servicio.ObtenerPorIdAsync(reserva.Id, _usuario.Id, esAdministrador: true));
    }

    [Fact]
    public async Task ObtenerTodas_UsuarioVeSoloLasSuyasYAdministradorVeTodas()
    {
        ReservaGuardada(1, Asiento("01"), Datos.Pasajero(1, dni: "11111111"), _usuario);
        ReservaGuardada(2, Asiento("02"), Datos.Pasajero(2, dni: "22222222"), _otroUsuario);
        ReservaGuardada(3, Asiento("03"), Datos.Pasajero(3, dni: "33333333"), _usuario);

        var propias = await _servicio.ObtenerTodasAsync(_usuario.Id, false, new FiltroReservas(), new ParametrosPaginacion());
        var todas = await _servicio.ObtenerTodasAsync(_usuario.Id, true, new FiltroReservas(), new ParametrosPaginacion());

        Assert.Equal(2, propias.Total);
        Assert.All(propias.Items, r => Assert.Equal(_usuario.Id, r.UsuarioId));
        Assert.Equal(3, todas.Total);
    }

    [Fact]
    public async Task ObtenerTodas_ConFiltroYPaginacion_DevuelveLaPaginaYElTotalFiltrado()
    {
        var ahora = DateTime.UtcNow;
        for (int i = 1; i <= 5; i++)
        {
            var estado = i == 5 ? EstadoReserva.Cancelada : EstadoReserva.Confirmada;
            ReservaGuardada(i, Asiento($"0{i}"), Datos.Pasajero(i, dni: $"1000000{i}"), _usuario, estado, ahora.AddMinutes(i));
        }

        var pagina = await _servicio.ObtenerTodasAsync(
            _usuario.Id, true,
            new FiltroReservas { Estado = EstadoReserva.Confirmada },
            new ParametrosPaginacion { Pagina = 2, Tamanio = 3 });

        Assert.Equal(4, pagina.Total);           // 4 confirmadas en total
        var unica = Assert.Single(pagina.Items); // la página 2 de 3 en 3 tiene 1
        Assert.Equal(1, unica.Id);               // de la más nueva a la más vieja: 4,3,2 | 1
    }
}
