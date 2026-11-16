import client from './client.js';
import { adaptVuelo, adaptVueloDetalle } from './adapters.js';

export async function listar() {
  const { data } = await client.get('/vuelos');
  return data.map(adaptVuelo);
}

export async function obtener(id) {
  const { data } = await client.get(`/vuelos/${id}`);
  return adaptVuelo(data);
}

/** El vuelo y sus asientos en una sola petición (GET /vuelos/{id} ya incluye `asientos`). */
export async function obtenerDetalle(id) {
  const { data } = await client.get(`/vuelos/${id}`);
  return adaptVueloDetalle(data);
}

/** Asientos del vuelo con su disponibilidad actual: [{ id, numero, categoria, disponible }]. */
export async function obtenerAsientos(id) {
  return (await obtenerDetalle(id)).asientos;
}

export async function crear(dto) {
  const { data } = await client.post('/vuelos', dto);
  return adaptVuelo(data);
}

export async function actualizar(id, dto) {
  const { data } = await client.put(`/vuelos/${id}`, dto);
  return adaptVuelo(data);
}

export async function eliminar(id) {
  const { data } = await client.delete(`/vuelos/${id}`);
  return data;
}

export default { listar, obtener, obtenerDetalle, obtenerAsientos, crear, actualizar, eliminar };
