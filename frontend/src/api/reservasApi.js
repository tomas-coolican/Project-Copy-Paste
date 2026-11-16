import client from './client.js';
import { adaptReserva } from './adapters.js';

export async function listar() {
  const { data } = await client.get('/reservas');
  return data.map(adaptReserva);
}

/**
 * Contrato 4.5: { vueloId, asientoId, pasajero: { nombre, apellido, documento } }.
 * El usuario no viaja en el body: el backend lo toma del token.
 */
export async function crear({ vueloId, asientoId, pasajero }) {
  const { data } = await client.post('/reservas', {
    vueloId,
    asientoId,
    pasajero: {
      nombre: pasajero.nombre,
      apellido: pasajero.apellido,
      documento: pasajero.documento,
    },
  });
  return adaptReserva(data);
}

/** DELETE responde 204 sin cuerpo: no hay objeto que devolver. */
export async function cancelar(id) {
  await client.delete(`/reservas/${id}`);
}

export default { listar, crear, cancelar };
