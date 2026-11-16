import { Link, Outlet } from 'react-router-dom';
import Button from '../components/Button.jsx';
import Masthead from '../components/Masthead.jsx';
import useAuth from '../hooks/useAuth.js';

function AccionesPublicas() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <>
        <Link
          to="/login"
          className="border-b border-transparent py-2 text-app-label font-medium text-ink-muted no-underline hover:border-accent hover:text-ink"
        >
          Ingresar
        </Link>
        <Button as={Link} to="/dashboard" size="sm" icon="arrow">
          Abrir tablero
        </Button>
      </>
    );
  }

  return (
    <>
      <span className="text-app-body-sm text-ink-muted">{user.nombre}</span>
      <Button variant="secondary" size="sm" onClick={logout}>
        Cerrar sesión
      </Button>
      <Button as={Link} to="/dashboard" size="sm" icon="arrow">
        Abrir tablero
      </Button>
    </>
  );
}

/** Páginas públicas: cabecera con el estado de sesión y el contenido debajo. */
export default function PublicLayout() {
  return (
    <>
      <Masthead actions={<AccionesPublicas />} />
      <main id="contenido">
        <Outlet />
      </main>
    </>
  );
}
