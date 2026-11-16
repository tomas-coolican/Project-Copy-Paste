import client from './client.js';
import { adaptSesion } from './adapters.js';

export async function registro({ nombre, email, password }) {
  const { data } = await client.post('/auth/registro', { nombre, email, password });
  return adaptSesion(data);
}

export async function login({ email, password }) {
  const { data } = await client.post('/auth/login', { email, password });
  return adaptSesion(data);
}

export default { registro, login };
