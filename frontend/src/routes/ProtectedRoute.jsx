import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

/**
 * Oculta pantallas a quien no inició sesión. NO protege datos: la seguridad real
 * está en el backend ([Authorize]); cualquiera puede leer el bundle y llamar a la API.
 */
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}
