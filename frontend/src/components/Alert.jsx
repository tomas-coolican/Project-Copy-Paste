import Icon from './Icon.jsx';

// Cuatro lámparas: color de estado solo como ícono y texto, sobre lavado + línea de 1 px.
// `surface="ink"`: sobre banda ink el lavado pasa a transparente y el color a su variante inversa.
const TONES = {
  info: {
    icon: 'info',
    role: 'status',
    light: { box: 'border-info-line bg-info-surface', icon: 'text-info' },
    ink: { box: 'border-info-inverse/40', icon: 'text-info-inverse' },
  },
  success: {
    icon: 'check',
    role: 'status',
    light: { box: 'border-success-line bg-success-surface', icon: 'text-success' },
    ink: { box: 'border-success-inverse/40', icon: 'text-success-inverse' },
  },
  warning: {
    icon: 'warning',
    role: 'status',
    light: { box: 'border-warning-line bg-warning-surface', icon: 'text-warning' },
    ink: { box: 'border-warning-inverse/40', icon: 'text-warning-inverse' },
  },
  danger: {
    icon: 'danger',
    role: 'alert',
    light: { box: 'border-danger-line bg-danger-surface', icon: 'text-danger' },
    ink: { box: 'border-danger-inverse/40', icon: 'text-danger-inverse' },
  },
};

const TEXT = {
  light: { title: 'text-ink', body: 'text-ink-muted', meta: 'text-ink-faint' },
  ink: { title: 'text-ink-inverse', body: 'text-ink-inverse-strong', meta: 'text-ink-inverse-muted' },
};

/**
 * El título nombra la condición ("Sin conexión"); el cuerpo, el próximo paso.
 * Máximo una acción (`action`). Sin barra lateral, sin sombra.
 */
export default function Alert({ tone = 'info', surface = 'light', title, meta, action, role, className = '', children }) {
  const config = TONES[tone];
  const colors = config[surface];
  const text = TEXT[surface];

  return (
    <div
      role={role ?? config.role}
      className={`flex max-w-[720px] gap-3 rounded-control border p-4 ${colors.box} ${className}`}
    >
      <Icon name={config.icon} size={20} className={`mt-px ${colors.icon}`} />
      <div className="min-w-0 flex-1">
        <p className={`m-0 text-app-body font-semibold ${text.title}`}>{title}</p>
        {children && <div className={`mt-0.5 text-app-body-sm ${text.body}`}>{children}</div>}
        {meta && <p className={`m-0 mt-1.5 font-mono text-app-label uppercase ${text.meta}`}>{meta}</p>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
