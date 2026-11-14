namespace VuelosApi.Dtos.Auth;

public class AuthRespuestaDTO
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiraEn { get; set; }
    public UsuarioRespuestaDTO Usuario { get; set; } = new();
}
