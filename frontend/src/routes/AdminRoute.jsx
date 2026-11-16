import { Link, Outlet } from 'react-router-dom';
import Button from '../components/Button.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import useAuth from '../hooks/useAuth.js';

/**
 * Oculta pantallas de administración a quien no es administrador. NO protege datos:
 * el servidor es quien debe rechazar las escrituras (ver pendientes de backend).
 */
export default function AdminRoute() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="py-10">
        <ErrorMessage
          error={{ status: 403 }}
          action={
            <Button as={Link} to="/dashboard" variant="secondary" size="sm">
              Volver al inicio
            </Button>
          }
        />
      </div>
    );
  }

  return <Outlet />;
}
