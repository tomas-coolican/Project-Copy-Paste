// Forma antes que tono: anillo = esperado, círculo = vivo/confirmado,
// cuadrado = cerrado, anillo tachado = anulado. El texto visible es el nombre accesible.
const ESTADOS = {
  Programado: {
    shape: 'ring',
    light: { mark: 'text-line-strong', text: 'text-ink-muted' },
    ink: { mark: 'text-line-inverse-strong', text: 'text-ink-inverse-muted' },
  },
  'En vuelo': {
    shape: 'dot',
    light: { mark: 'text-accent', text: 'text-ink' },
    ink: { mark: 'text-accent', text: 'text-ink-inverse' },
  },
  Finalizado: {
    shape: 'square',
    light: { mark: 'text-ink-faint', text: 'text-ink-muted' },
    ink: { mark: 'text-ink-inverse-muted', text: 'text-ink-inverse-muted' },
  },
  Cancelado: {
    shape: 'void',
    light: { mark: 'text-danger', text: 'text-danger' },
    ink: { mark: 'text-danger-inverse', text: 'text-danger-inverse' },
  },
  Confirmada: {
    shape: 'dot',
    light: { mark: 'text-success', text: 'text-success' },
    ink: { mark: 'text-success-inverse', text: 'text-success-inverse' },
  },
  Cancelada: {
    shape: 'void',
    light: { mark: 'text-ink-faint', text: 'text-ink-muted' },
    ink: { mark: 'text-ink-inverse-muted', text: 'text-ink-inverse-muted' },
  },
};

const SIZES = {
  sm: {
    root: 'gap-status-gap-sm text-app-label',
    mark: 'size-(--size-status-dot-sm)',
  },
  md: {
    root: 'gap-status-gap-md text-app-data',
    mark: 'size-(--size-status-dot-md)',
  },
};

const STROKE = { strokeWidth: 'var(--border-status)', vectorEffect: 'non-scaling-stroke' };

function Mark({ shape, className }) {
  return (
    <svg viewBox="0 0 6 6" aria-hidden="true" focusable="false" className={`${className} shrink-0 overflow-visible`}>
      {shape === 'dot' && <circle cx="3" cy="3" r="3" fill="currentColor" />}
      {shape === 'square' && <rect width="6" height="6" fill="currentColor" />}
      {(shape === 'ring' || shape === 'void') && (
        <circle cx="3" cy="3" r="2.6" fill="none" stroke="currentColor" style={STROKE} />
      )}
      {shape === 'void' && (
        <line x1="-0.6" y1="6.6" x2="6.6" y2="-0.6" stroke="currentColor" style={STROKE} />
      )}
    </svg>
  );
}

/**
 * `estado` es el texto fijo del dominio: Programado, En vuelo, Finalizado,
 * Cancelado (vuelos) · Confirmada, Cancelada (reservas).
 * `tone="ink"` para filas sobre banda ink; nunca usar danger claro sobre ink.
 */
export default function StatusIndicator({ estado, size = 'sm', tone = 'light', className = '' }) {
  const config = ESTADOS[estado];
  const sizeClasses = SIZES[size];

  if (!config) {
    return <span className={`font-mono ${sizeClasses.root} text-ink-muted ${className}`}>{estado}</span>;
  }

  const colors = config[tone];

  return (
    <span className={`inline-flex items-center whitespace-nowrap font-mono ${sizeClasses.root} ${colors.text} ${className}`}>
      <Mark shape={config.shape} className={`${sizeClasses.mark} ${colors.mark}`} />
      {estado}
    </span>
  );
}
