import { Link, Outlet, useLocation } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { SECCIONES } from '../components/landing/secciones.js';
import Masthead from '../components/Masthead.jsx';
import useAuth from '../hooks/useAuth.js';

function AccionesPublicas() {
  const { user, isAuthenticated, logout } = useAuth();
  const esLanding = useLocation().pathname === '/';

  if (!isAuthenticated) {
    return (
      <>
        <Link
          to="/login"
          className="border-b border-transparent py-2 text-[12.5px] font-medium text-ink-muted no-underline hover:border-accent hover:text-ink"
        >
          Ingresar
        </Link>
        <Button as={Link} to={esLanding ? '/registro' : '/dashboard'} size="sm" icon="arrow">
          {esLanding ? 'Crear cuenta' : 'Abrir tablero'}
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
        {esLanding ? 'Ir al tablero' : 'Abrir tablero'}
      </Button>
    </>
  );
}

/** Páginas públicas: cabecera con el estado de sesión y el contenido debajo. */
export default function PublicLayout() {
  return (
    <>
      <Masthead nav={SECCIONES} actions={<AccionesPublicas />} />
      <main id="contenido">
        <Outlet />
      </main>
    </>
  );
}
