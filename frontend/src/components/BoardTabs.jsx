import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const TAB =
  '-mb-px inline-flex min-h-(--size-touch) shrink-0 items-center border-b-2 border-transparent px-0 pb-3 pt-1 font-sans text-app-body-sm font-medium no-underline transition-colors duration-(--duration-state) hover:text-ink-inverse aria-[current=page]:border-accent aria-[current=page]:text-ink-inverse';

/** Navegación principal del tablero sobre banda ink. Los enlaces respetan el foco inverso. */
export default function BoardTabs({ items, label = 'Secciones del tablero' }) {
  const contenedorRef = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    contenedorRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
    });
  }, [pathname]);

  return (
    <nav data-surface="ink" aria-label={label} className="border-b border-line-inverse-strong bg-surface-ink">
      <div
        ref={contenedorRef}
        className="mx-auto flex w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] gap-6 overflow-x-auto sm:gap-8"
      >
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `${TAB} ${isActive ? 'text-ink-inverse' : 'text-ink-inverse-muted'}`}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
