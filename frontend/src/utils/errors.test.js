import { describe, expect, it } from 'vitest';
import { ApiError, getFieldErrors, toApiError } from './errors.js';

// Error con la forma que tiene Axios cuando el servidor responde.
const respuesta = (status, data) => ({ response: { status, data } });

describe('toApiError', () => {
  it('sin respuesta del servidor es un error de red', () => {
    const error = toApiError(new Error('Network Error'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.isNetworkError).toBe(true);
    expect(error.status).toBeNull();
  });

  it('usa el "detail" del ProblemDetails como mensaje', () => {
    const error = toApiError(respuesta(409, { title: 'Conflicto', detail: 'El asiento 03 ya está reservado.' }));

    expect(error.status).toBe(409);
    expect(error.message).toBe('El asiento 03 ya está reservado.');
  });

  it('normaliza los errores de validación por campo', () => {
    const error = toApiError(
      respuesta(400, { title: 'One or more validation errors occurred.', errors: { FechaLlegada: ['Posterior a la salida.'] } }),
    );

    expect(error.message).toBe('Revisá los campos marcados.');
    expect(error.fieldErrors).toEqual({ fechaLlegada: ['Posterior a la salida.'] });
  });

  it('sin mensaje del servidor usa uno según el código', () => {
    expect(toApiError(respuesta(403, {})).message).toBe('No tenés permisos para realizar esta acción.');
  });

  it('no envuelve dos veces un ApiError', () => {
    const original = new ApiError({ message: 'x', status: 404 });

    expect(toApiError(original)).toBe(original);
  });
});

describe('getFieldErrors', () => {
  it('devuelve un objeto vacío si no hay errores de campo', () => {
    expect(getFieldErrors(respuesta(500, {}))).toEqual({});
  });
});
