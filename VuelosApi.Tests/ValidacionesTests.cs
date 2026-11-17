using System.ComponentModel.DataAnnotations;
using VuelosApi.Dtos;
using VuelosApi.Dtos.Reserva;
using VuelosApi.Dtos.Vuelo;

namespace VuelosApi.Tests;

// Validaciones de los DTOs (lo que ASP.NET Core responde como 400 antes de llegar al servicio).
public class ValidacionesTests
{
    private static List<ValidationResult> Validar(object modelo)
    {
        var errores = new List<ValidationResult>();
        Validator.TryValidateObject(modelo, new ValidationContext(modelo), errores, validateAllProperties: true);
        return errores;
    }

    private static PasajeroReservaDTO PasajeroValido() =>
        new() { Nombre = "Ana", Apellido = "Pérez", Documento = "30123456" };

    // ---------- Reserva ----------

    [Fact]
    public void Reserva_ConDatosDelPasajero_EsValida()
    {
        Assert.Empty(Validar(new CrearReservaDTO { VueloId = 1, AsientoId = 1, Pasajero = PasajeroValido() }));
    }

    [Fact]
    public void Reserva_SinPasajero_EsInvalida()
    {
        var errores = Validar(new CrearReservaDTO { VueloId = 1, AsientoId = 1 });

        Assert.Contains(errores, e => e.MemberNames.Contains(nameof(CrearReservaDTO.Pasajero)));
    }

    [Fact]
    public void Reserva_ConPasajeroIdYDatosALaVez_EsInvalida()
    {
        var errores = Validar(new CrearReservaDTO { VueloId = 1, AsientoId = 1, PasajeroId = 3, Pasajero = PasajeroValido() });

        Assert.Single(errores);
    }

    [Fact]
    public void Reserva_SinVueloNiAsiento_EsInvalida()
    {
        var errores = Validar(new CrearReservaDTO { Pasajero = PasajeroValido() });

        Assert.Contains(errores, e => e.MemberNames.Contains(nameof(CrearReservaDTO.VueloId)));
        Assert.Contains(errores, e => e.MemberNames.Contains(nameof(CrearReservaDTO.AsientoId)));
    }

    [Theory]
    [InlineData("30123456", true)]
    [InlineData("AB123456", true)]
    [InlineData("12345", false)]         // muy corto
    [InlineData("30.123.456", false)]    // con puntos
    [InlineData("30 123 456", false)]    // con espacios en el medio
    [InlineData("", false)]
    public void Pasajero_FormatoDelDocumento(string documento, bool esValido)
    {
        var pasajero = PasajeroValido();
        pasajero.Documento = documento;

        Assert.Equal(esValido, Validar(pasajero).Count == 0);
    }

    [Fact]
    public void Pasajero_ConEmailInvalido_EsInvalido()
    {
        var pasajero = PasajeroValido();
        pasajero.Email = "no-es-un-email";

        Assert.Contains(Validar(pasajero), e => e.MemberNames.Contains(nameof(PasajeroReservaDTO.Email)));
    }

    // ---------- Vuelo ----------

    private static CrearVueloDTO VueloValido()
    {
        var salida = DateTime.UtcNow.AddDays(3);
        return new CrearVueloDTO
        {
            Codigo = "AR5000", Origen = "Buenos Aires", Destino = "Salta",
            FechaSalida = salida, FechaLlegada = salida.AddHours(2),
            Precio = 80000m, CantidadAsientos = 20, CantidadAsientosEjecutivos = 4
        };
    }

    [Fact]
    public void Vuelo_ConDatosCorrectos_EsValido()
    {
        Assert.Empty(Validar(VueloValido()));
    }

    [Fact]
    public void Vuelo_ConLlegadaAntesDeLaSalida_EsInvalido()
    {
        var vuelo = VueloValido();
        vuelo.FechaLlegada = vuelo.FechaSalida!.Value.AddHours(-1);

        Assert.Contains(Validar(vuelo), e => e.MemberNames.Contains(nameof(CrearVueloDTO.FechaLlegada)));
    }

    [Fact]
    public void Vuelo_NuevoConSalidaPasada_EsInvalido()
    {
        var vuelo = VueloValido();
        vuelo.FechaSalida = DateTime.UtcNow.AddDays(-1);
        vuelo.FechaLlegada = vuelo.FechaSalida.Value.AddHours(2);

        Assert.Contains(Validar(vuelo), e => e.MemberNames.Contains(nameof(CrearVueloDTO.FechaSalida)));
    }

    [Fact]
    public void Vuelo_ConMasEjecutivosQueAsientos_EsInvalido()
    {
        var vuelo = VueloValido();
        vuelo.CantidadAsientosEjecutivos = 21;

        Assert.Contains(Validar(vuelo), e => e.MemberNames.Contains(nameof(CrearVueloDTO.CantidadAsientosEjecutivos)));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(501)]
    public void Vuelo_ConCantidadDeAsientosFueraDeRango_EsInvalido(int asientos)
    {
        var vuelo = VueloValido();
        vuelo.CantidadAsientos = asientos;
        vuelo.CantidadAsientosEjecutivos = 0;

        Assert.Contains(Validar(vuelo), e => e.MemberNames.Contains(nameof(CrearVueloDTO.CantidadAsientos)));
    }

    // ---------- Paginación ----------

    [Fact]
    public void Paginacion_SinParametros_NoEstaActiva()
    {
        var paginacion = new ParametrosPaginacion();

        Assert.False(paginacion.Activa);
        Assert.Empty(Validar(paginacion));
    }

    [Theory]
    [InlineData(1, 10, 0, 10)]
    [InlineData(3, 10, 20, 10)]
    [InlineData(2, 25, 25, 25)]
    public void Paginacion_CalculaCuantosSaltarYTomar(int pagina, int tamanio, int saltar, int tomar)
    {
        var paginacion = new ParametrosPaginacion { Pagina = pagina, Tamanio = tamanio };

        Assert.True(paginacion.Activa);
        Assert.Equal(saltar, paginacion.Saltar);
        Assert.Equal(tomar, paginacion.Tomar);
    }

    [Fact]
    public void Paginacion_SoloConPagina_UsaElTamanioPorDefecto()
    {
        var paginacion = new ParametrosPaginacion { Pagina = 2 };

        Assert.Equal(ParametrosPaginacion.TamanioPorDefecto, paginacion.Tomar);
        Assert.Equal(ParametrosPaginacion.TamanioPorDefecto, paginacion.Saltar);
    }

    [Theory]
    [InlineData(0, 10)]
    [InlineData(1, 0)]
    [InlineData(1, 101)]
    public void Paginacion_FueraDeRango_EsInvalida(int pagina, int tamanio)
    {
        Assert.NotEmpty(Validar(new ParametrosPaginacion { Pagina = pagina, Tamanio = tamanio }));
    }
}
