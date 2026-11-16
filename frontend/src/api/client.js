import axios from 'axios';
import { toApiError } from '../utils/errors.js';

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
  throw new Error(
    'VITE_API_URL no está definida. Copiá frontend/.env.example a frontend/.env y configurá la URL del backend.',
  );
}

const client = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let onUnauthorized = null;

/** Registra qué hacer ante un 401 (limpiar sesión y mandar al login). Lo usa AuthContext. */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

// Un 401 en /auth/* es un login incorrecto, no una sesión vencida.
function esPeticionDeAuth(url = '') {
  return /(^|\/)auth\//.test(url);
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !esPeticionDeAuth(error.config?.url)) {
      onUnauthorized?.();
    }

    return Promise.reject(toApiError(error));
  },
);

export default client;
