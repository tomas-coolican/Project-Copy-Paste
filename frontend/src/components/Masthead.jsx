import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

const NAV_LINK =
  'flex items-center border-b border-transparent py-2 font-sans text-app-label font-medium normal-case tracking-normal text-ink-muted no-underline transition-colors duration-(--duration-state) hover:border-accent hover:text-ink aria-[current=page]:border-b-2 aria-[current=page]:border-accent aria-[current=page]:text-ink';

/**
 * Cabecera fija (única sombra fuera de los tickets).
 * `nav`: [{ to, label, end? }]. `actions`: nodo a la derecha (ingresar, usuario, CTA);
 * en menos de 900 px el menú abre una lista de filas de 48 px con las mismas acciones.
 * Escape cierra el menú y devuelve el foco al botón.
 */
export default function Masthead({ nav = [], actions = null, contextLabel = 'Sistema de gestión' }) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-surface shadow-header">
      <a
        href="#contenido"
        className="fixed left-3 top-3 z-50 -translate-y-40 rounded-control bg-ink px-4 py-3 text-app-body-sm font-medium text-ink-inverse no-underline focus:translate-y-0 focus-visible:outline-focus-inverse"
      >
        Saltar al contenido
      </a>

      <div className="mx-auto flex min-h-19 w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] items-center gap-6">
        <Link to="/" className="flex min-w-0 items-center gap-3.5 text-ink no-underline">
          <span className="whitespace-nowrap text-[22px] font-bold leading-none tracking-[-0.04em]">Vuelos</span>
          <span className="hidden border-l border-line-strong pl-3.5 font-mono text-app-label uppercase text-ink-faint sm:inline">
            {contextLabel}
          </span>
        </Link>

        {nav.length > 0 && (
          <nav aria-label="Principal" className="ml-auto hidden items-center gap-7 md:flex">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={NAV_LINK}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className={`flex items-center gap-4 ${nav.length > 0 ? '' : 'ml-auto'}`}>
          <div className="hidden items-center gap-4 md:flex">{actions}</div>
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((value) => !value)}
            className="relative size-(--size-touch) rounded-control border border-line-strong bg-transparent text-ink md:hidden"
          >
            <span className={`absolute left-1/2 top-1/2 h-[1.5px] w-[18px] -translate-x-1/2 bg-current transition-transform duration-(--duration-state) ${open ? '-translate-y-1/2 rotate-45' : '-translate-y-[calc(50%+3.25px)]'}`} />
            <span className={`absolute left-1/2 top-1/2 h-[1.5px] w-[18px] -translate-x-1/2 bg-current transition-transform duration-(--duration-state) ${open ? '-translate-y-1/2 -rotate-45' : '-translate-y-[calc(50%-3.25px)]'}`} />
          </button>
        </div>
      </div>

      {open && (
        <nav id="menu-movil" aria-label="Principal en móvil" className="border-t border-line px-gutter pb-6 pt-2 md:hidden">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={close}
              className="flex min-h-12 items-center border-b border-line text-app-body text-ink no-underline aria-[current=page]:font-semibold"
            >
              {item.label}
            </NavLink>
          ))}
          {actions && (
            <div className="mt-4 flex flex-col gap-3" onClick={close}>
              {actions}
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
