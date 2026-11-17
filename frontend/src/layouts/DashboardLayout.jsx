import { Outlet } from 'react-router-dom';
import Button from '../components/Button.jsx';
import Masthead from '../components/Masthead.jsx';
import useAuth from '../hooks/useAuth.js';

function AccionesUsuario() {
  const { user, logout } = useAuth();

  return (
    <>
      <span className="hidden text-app-body-sm text-ink-muted sm:inline">{user.nombre}</span>
      <Button variant="secondary" size="sm" onClick={logout}>
        Cerrar sesión
      </Button>
    </>
  );
}

/** Tablero autenticado: navegación y sesión comparten el masthead de la landing. */
export default function DashboardLayout() {
  const { isAdmin } = useAuth();
  const tabs = [
    { to: '/dashboard', label: 'Inicio', end: true },
    { to: '/dashboard/vuelos', label: 'Vuelos' },
    { to: '/dashboard/reservas', label: 'Mis reservas' },
  ];

  if (isAdmin) tabs.push({ to: '/admin', label: 'Administración' });

  return (
    <>
      <Masthead nav={tabs} actions={<AccionesUsuario />} />
      <main id="contenido" className="pb-16">
        <Outlet />
      </main>
    </>
  );
}
