import { NavLink } from 'react-router-dom';

const TAB =
  'border-b-2 border-transparent pb-2 text-app-body-sm text-ink-faint no-underline hover:text-ink aria-[current=page]:border-accent aria-[current=page]:text-ink';

/** Ingresar / Crear cuenta: dos rutas, conservan el destino guardado. */
export default function AuthTabs({ state }) {
  return (
    <nav aria-label="Acceso" className="mt-6 flex gap-5 border-b border-line">
      <NavLink to="/login" state={state} replace className={TAB}>
        Ingresar
      </NavLink>
      <NavLink to="/registro" state={state} replace className={TAB}>
        Crear cuenta
      </NavLink>
    </nav>
  );
}
