import client from './client.js';
import { adaptPasajero } from './adapters.js';

export async function listar() {
  const { data } = await client.get('/pasajeros');
  return data.map(adaptPasajero);
}

export async function obtener(id) {
  const { data } = await client.get(`/pasajeros/${id}`);
  return adaptPasajero(data);
}

export async function crear(dto) {
  const { data } = await client.post('/pasajeros', dto);
  return adaptPasajero(data);
}

export async function eliminar(id) {
  const { data } = await client.delete(`/pasajeros/${id}`);
  return data;
}

export default { listar, obtener, crear, eliminar };
