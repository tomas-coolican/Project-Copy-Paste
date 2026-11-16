import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/admin', label: 'Vuelos', end: true },
  { to: '/admin/reservas', label: 'Reservas' },
];

export default function AdminTabs() {
  return (
    <nav aria-label="Secciones de administración" className="mt-6 border-b border-line">
      <div className="flex gap-6">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `-mb-px inline-flex min-h-(--size-touch) items-center border-b-2 px-0 pb-3 pt-1 font-sans text-app-body-sm font-medium no-underline transition-colors duration-(--duration-state) ${
                isActive
                  ? 'border-accent text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
