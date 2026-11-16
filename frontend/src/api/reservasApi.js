import client from './client.js';
import { adaptReserva } from './adapters.js';

export async function listar() {
  const { data } = await client.get('/reservas');
  return data.map(adaptReserva);
}

/** DELETE responde 204 sin cuerpo: no hay objeto que devolver. */
export async function cancelar(id) {
  await client.delete(`/reservas/${id}`);
}

export default { listar, cancelar };
