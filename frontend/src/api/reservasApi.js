import client from './client.js';
import { adaptReserva, ESTADO_RESERVA } from './adapters.js';

export async function listar() {
  const { data } = await client.get('/reservas');
  return data.map(adaptReserva);
}

const CODIGO_ESTADO = Object.fromEntries(Object.entries(ESTADO_RESERVA).map(([codigo, texto]) => [texto, codigo]));

/**
 * Página de reservas filtrada en el servidor: GET /reservas?pagina=&tamanio=&estado=&vueloId=.
 * `estado` es el texto ('Confirmada' / 'Cancelada'); vacío = todos. El total sale del header X-Total-Count.
 */
export async function buscar({ pagina = 1, tamanio = 10, estado = '', vueloId = '' } = {}) {
  const params = { pagina, tamanio };
  if (estado) params.estado = CODIGO_ESTADO[estado];
  if (vueloId) params.vueloId = vueloId;

  const { data, headers } = await client.get('/reservas', { params });
  return {
    items: data.map(adaptReserva),
    total: Number(headers['x-total-count'] ?? data.length),
  };
}

/**
 * El usuario sale del token. El pasajero se indica de una de dos formas (exactamente una):
 * - `pasajeroId`: un pasajero ya existente → { pasajeroId, vueloId, asientoId }.
 * - `pasajero`: { nombre, apellido, documento, email?, telefono? } → el backend lo busca por
 *   documento y, si no existe, lo crea (email y teléfono se guardan solo en ese caso).
 */
export async function crear({ vueloId, asientoId, pasajeroId, pasajero }) {
  const cuerpo = pasajero
    ? {
        vueloId,
        asientoId,
        pasajero: {
          nombre: pasajero.nombre,
          apellido: pasajero.apellido,
          documento: pasajero.documento,
          email: pasajero.email || undefined,
          telefono: pasajero.telefono || undefined,
        },
      }
    : { vueloId, asientoId, pasajeroId };

  const { data } = await client.post('/reservas', cuerpo);
  return adaptReserva(data);
}

/** DELETE responde 204 sin cuerpo: no hay objeto que devolver. */
export async function cancelar(id) {
  await client.delete(`/reservas/${id}`);
}

export default { listar, buscar, crear, cancelar };
