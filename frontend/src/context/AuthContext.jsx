import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setUnauthorizedHandler } from '../api/client.js';
import * as authApi from '../api/authApi.js';
import { AuthContext, ROL_ADMIN } from './authContext.js';

const CLAVE_TOKEN = 'token';
const CLAVE_SESION = 'sesion';

function leerSesion() {
  try {
    const token = localStorage.getItem(CLAVE_TOKEN);
    const guardada = JSON.parse(localStorage.getItem(CLAVE_SESION) ?? 'null');

    if (!token || !guardada?.usuario || !guardada.expiraEn) return null;
    if (new Date(guardada.expiraEn).getTime() <= Date.now()) return null;

    return { usuario: guardada.usuario, expiraEn: guardada.expiraEn };
  } catch {
    return null;
  }
}

function guardarSesion({ token, expiraEn, usuario }) {
  try {
    localStorage.setItem(CLAVE_TOKEN, token);
    localStorage.setItem(CLAVE_SESION, JSON.stringify({ usuario, expiraEn: expiraEn.toISOString() }));
  } catch {
    // Sin almacenamiento la sesión dura lo que dure la pestaña.
  }
}

function borrarSesion() {
  try {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_SESION);
  } catch {
    // Nada que limpiar.
  }
}

/**
 * Sesión del usuario. Recargar conserva la sesión (token + datos en localStorage).
 * El token dura 60 minutos y no hay renovación: al vencer o ante un 401 se cierra
 * la sesión y se manda a /login guardando el destino y avisando el motivo.
 *
 * Ojo: ProtectedRoute y AdminRoute ocultan pantallas; no protegen datos.
 */
export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [sesion, setSesion] = useState(leerSesion);
  const expiraEn = sesion?.expiraEn ?? null;
  const navigateRef = useRef(navigate);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const cerrarPorVencimiento = useCallback(() => {
    borrarSesion();
    setSesion(null);
    navigateRef.current('/login', {
      replace: true,
      state: {
        from: window.location.pathname + window.location.search,
        expirada: true,
      },
    });
  }, []);

  // Ante un 401 fuera de /auth/*.
  useEffect(() => {
    setUnauthorizedHandler(cerrarPorVencimiento);
    return () => setUnauthorizedHandler(null);
  }, [cerrarPorVencimiento]);

  // Avisar y cerrar cuando llegue la hora de expiración.
  useEffect(() => {
    if (!expiraEn) return undefined;

    const restante = new Date(expiraEn).getTime() - Date.now();
    const temporizador = setTimeout(cerrarPorVencimiento, Math.max(restante, 0));
    return () => clearTimeout(temporizador);
  }, [expiraEn, cerrarPorVencimiento]);

  const iniciar = useCallback((respuesta) => {
    guardarSesion(respuesta);
    setSesion({ usuario: respuesta.usuario, expiraEn: respuesta.expiraEn.toISOString() });
    return respuesta.usuario;
  }, []);

  const login = useCallback(async (credenciales) => iniciar(await authApi.login(credenciales)), [iniciar]);
  const registrar = useCallback(async (datos) => iniciar(await authApi.registro(datos)), [iniciar]);

  const logout = useCallback(() => {
    borrarSesion();
    setSesion(null);
    navigateRef.current('/', { replace: true });
  }, []);

  const valor = useMemo(
    () => ({
      user: sesion?.usuario ?? null,
      isAuthenticated: Boolean(sesion),
      isAdmin: sesion?.usuario.rol === ROL_ADMIN,
      login,
      registrar,
      logout,
    }),
    [sesion, login, registrar, logout],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
