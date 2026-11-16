import client from './client.js';
import { adaptReserva } from './adapters.js';

export async function listar() {
  const { data } = await client.get('/reservas');
  return data.map(adaptReserva);
}

/** El usuario sale del token; el cuerpo lleva solo { pasajeroId, vueloId, asientoId }. */
export async function crear({ pasajeroId, vueloId, asientoId }) {
  const { data } = await client.post('/reservas', { pasajeroId, vueloId, asientoId });
  return adaptReserva(data);
}

/** DELETE responde 204 sin cuerpo: no hay objeto que devolver. */
export async function cancelar(id) {
  await client.delete(`/reservas/${id}`);
}

export default { listar, crear, cancelar };
