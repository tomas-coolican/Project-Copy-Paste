import { numerosDePagina } from '../utils/paginacion.js';

const COLORES = {
  light: {
    texto: 'text-ink-muted',
    boton: 'border-line text-ink hover:border-ink',
    actual: 'border-accent bg-accent text-accent-ink',
    borde: 'border-line',
  },
  ink: {
    texto: 'text-ink-inverse-muted',
    boton: 'border-line-inverse-strong text-ink-inverse hover:border-ink-inverse',
    actual: 'border-accent bg-accent text-accent-ink',
    borde: 'border-line-inverse',
  },
};

/**
 * Controles de paginación. No se muestra si todo entra en una página.
 * `pagina` empieza en 1. `onCambiar(nuevaPagina)` la cambia. `tone="ink"` sobre banda oscura.
 */
export default function Paginacion({ pagina, totalPaginas, total, tamanio, onCambiar, tone = 'light', className = '' }) {
  if (totalPaginas <= 1) return null;

  const c = COLORES[tone];
  const desde = (pagina - 1) * tamanio + 1;
  const hasta = Math.min(pagina * tamanio, total);
  const base =
    'inline-flex min-h-(--size-touch) min-w-(--size-touch) items-center justify-center rounded-control border px-3 font-mono text-app-body-sm transition-colors duration-(--duration-state) disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <nav
      aria-label="Paginación"
      className={`mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t pt-4 ${c.borde} ${className}`}
    >
      <p className={`m-0 font-mono text-app-label uppercase ${c.texto}`} aria-live="polite">
        Mostrando {desde}–{hasta} de {total}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className={`${base} ${c.boton}`}
          onClick={() => onCambiar(pagina - 1)}
          disabled={pagina === 1}
          aria-label="Página anterior"
        >
          ←
        </button>
        {numerosDePagina(pagina, totalPaginas).map((n, i) =>
          n === '…' ? (
            <span key={`salto-${i}`} aria-hidden="true" className={`px-1 font-mono ${c.texto}`}>
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              className={`${base} ${n === pagina ? c.actual : c.boton}`}
              onClick={() => onCambiar(n)}
              aria-current={n === pagina ? 'page' : undefined}
              aria-label={`Página ${n}`}
            >
              {n}
            </button>
          ),
        )}
        <button
          type="button"
          className={`${base} ${c.boton}`}
          onClick={() => onCambiar(pagina + 1)}
          disabled={pagina === totalPaginas}
          aria-label="Página siguiente"
        >
          →
        </button>
      </div>
    </nav>
  );
}
