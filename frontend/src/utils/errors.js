const MENSAJES_POR_ESTADO = {
  400: 'Los datos enviados no son válidos.',
  401: 'Tu sesión no es válida o venció.',
  403: 'No tenés permisos para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  409: 'La operación entra en conflicto con el estado actual.',
  500: 'Ocurrió un error en el servidor.',
};

export class ApiError extends Error {
  constructor({ message, status = null, fieldErrors = {}, isNetworkError = false, cause }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.isNetworkError = isNetworkError;
    this.cause = cause;
  }
}

function normalizarCampo(campo) {
  if (!campo) return campo;
  return campo.charAt(0).toLowerCase() + campo.slice(1);
}

function normalizarErroresDeCampo(errors) {
  if (!errors || typeof errors !== 'object') return {};

  return Object.entries(errors).reduce((resultado, [campo, mensajes]) => {
    resultado[normalizarCampo(campo)] = Array.isArray(mensajes)
      ? mensajes
      : [String(mensajes)];
    return resultado;
  }, {});
}

export function toApiError(error) {
  if (error instanceof ApiError) return error;

  if (!error?.response) {
    return new ApiError({
      message: 'No se pudo conectar con el servidor. Verificá tu conexión e intentá nuevamente.',
      isNetworkError: true,
      cause: error,
    });
  }

  const { status, data } = error.response;
  const fieldErrors = normalizarErroresDeCampo(data?.errors);
  const tieneErroresDeCampo = Object.keys(fieldErrors).length > 0;

  const message =
    data?.mensaje ||
    data?.detail ||
    (tieneErroresDeCampo ? 'Revisá los campos marcados.' : data?.title) ||
    MENSAJES_POR_ESTADO[status] ||
    'Ocurrió un error inesperado.';

  return new ApiError({ message, status, fieldErrors, cause: error });
}

export function getFieldErrors(error) {
  return toApiError(error).fieldErrors;
}
