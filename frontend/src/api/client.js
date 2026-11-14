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

client.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
);

export default client;
