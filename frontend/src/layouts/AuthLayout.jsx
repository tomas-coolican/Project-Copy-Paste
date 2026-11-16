import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import Barcode from '../components/Barcode.jsx';
import Masthead from '../components/Masthead.jsx';
import useAuth from '../hooks/useAuth.js';

/**
 * Acceso y registro: una tarea por pantalla. La marca ocupa la mitad izquierda en escritorio
 * y desaparece por debajo de 900 px. Con sesión activa, redirige al destino guardado.
 */
export default function AuthLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to={location.state?.from ?? '/dashboard'} replace />;
  }

  return (
    <>
      <Masthead
        inlineActions
        actions={
          <Link
            to="/"
            className="border-b border-ink-faint py-1 text-app-body-sm font-medium text-ink no-underline hover:border-accent"
          >
            Volver a la landing
          </Link>
        }
      />
      <main id="contenido" className="grid min-h-[calc(100svh-var(--size-masthead))] md:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
        <aside className="hidden flex-col justify-between bg-surface-tint px-14 py-14 md:flex">
          <div>
            <h2 className="m-0 max-w-[12ch] text-headline">
              Todo el tablero, en una cuenta.
            </h2>
            <p className="m-0 mt-4 max-w-[42ch] text-app-body-sm text-ink-muted">
              Consultá vuelos, elegí asiento y seguí tus reservas desde el mismo lugar.
            </p>
          </div>
          <div aria-hidden="true">
            <div className="mb-4 border-t border-dashed border-line-strong" />
            <Barcode />
          </div>
        </aside>

        <div className="grid place-items-center px-gutter py-10 md:px-14">
          <div className="w-full max-w-[420px]">
            <Outlet />
          </div>
        </div>
      </main>
    </>
  );
}
