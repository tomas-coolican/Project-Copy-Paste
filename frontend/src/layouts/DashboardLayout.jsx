import { Outlet } from 'react-router-dom';
import BoardTabs from '../components/BoardTabs.jsx';
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

/** Tablero autenticado: masthead con la sesión y las pestañas de navegación sobre banda ink. */
export default function DashboardLayout() {
  const { isAdmin } = useAuth();
  const tabs = [
    { to: '/dashboard', label: 'Inicio', end: true },
    { to: '/dashboard/vuelos', label: 'Vuelos' },
  ];

  if (isAdmin) tabs.push({ to: '/admin', label: 'Administración' });

  return (
    <>
      <Masthead inlineActions actions={<AccionesUsuario />} />
      <BoardTabs items={tabs} />
      <main id="contenido" className="pb-16">
        <Outlet />
      </main>
    </>
  );
}
