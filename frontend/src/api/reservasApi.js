import client from './client.js';
import { adaptReserva } from './adapters.js';

export async function listar() {
  const { data } = await client.get('/reservas');
  return data.map(adaptReserva);
}

/**
 * El usuario sale del token. El pasajero se indica de una de dos formas (exactamente una):
 * - `pasajeroId`: un pasajero ya existente → { pasajeroId, vueloId, asientoId }.
 * - `pasajero`: { nombre, apellido, documento } → el backend lo busca por documento o lo crea.
 */
export async function crear({ vueloId, asientoId, pasajeroId, pasajero }) {
  const cuerpo = pasajero
    ? {
        vueloId,
        asientoId,
        pasajero: { nombre: pasajero.nombre, apellido: pasajero.apellido, documento: pasajero.documento },
      }
    : { vueloId, asientoId, pasajeroId };

  const { data } = await client.post('/reservas', cuerpo);
  return adaptReserva(data);
}

/** DELETE responde 204 sin cuerpo: no hay objeto que devolver. */
export async function cancelar(id) {
  await client.delete(`/reservas/${id}`);
}

export default { listar, crear, cancelar };
