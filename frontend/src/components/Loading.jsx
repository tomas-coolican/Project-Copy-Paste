import Icon from './Icon.jsx';

const BAR_WIDTHS = ['w-2/5', 'w-2/3', 'w-1/4', 'w-1/2', 'w-1/3'];

function Row({ index }) {
  return (
    <div className="relative h-14 rounded-control bg-surface-tint">
      <span
        className={`absolute left-3 top-1/2 h-2 -translate-y-1/2 rounded-control bg-info/15 ${BAR_WIDTHS[index % BAR_WIDTHS.length]}`}
      />
    </div>
  );
}

/**
 * Esqueleto del tamaño del contenido final. `rows` (lista), `table` (encabezado + filas),
 * `panel` (título + cuerpo) e `inline` (texto + anillo, con 300 ms de demora).
 * Para el resto de la región: aria-busy y un único role="status".
 */
export default function Loading({ variant = 'rows', rows = 5, label = 'Cargando…', className = '' }) {
  if (variant === 'inline') {
    return (
      <p role="status" className={`m-0 inline-flex animate-delayed-in items-center gap-2 text-app-body-sm text-ink-muted ${className}`}>
        <Icon name="spinner" size={16} className="animate-spin" />
        {label}
      </p>
    );
  }

  const count = Math.min(rows, 5);

  return (
    <div aria-busy="true" className={`animate-skeleton ${className}`}>
      <p role="status" className="sr-only">{label}</p>
      <div aria-hidden="true" className="flex flex-col gap-1.5">
        {variant === 'table' && <div className="h-11 rounded-control bg-surface-tint" />}
        {variant === 'panel' && (
          <>
            <div className="h-8 w-2/5 rounded-control bg-surface-tint" />
            <div className="h-24 rounded-control bg-surface-tint" />
          </>
        )}
        {variant !== 'panel' && Array.from({ length: count }, (_, i) => <Row key={i} index={i} />)}
      </div>
    </div>
  );
}
