import Icon from './Icon.jsx';

// Cuatro lámparas: color de estado solo como ícono y texto, sobre lavado + línea de 1 px.
const TONES = {
  info: { icon: 'info', box: 'border-info-line bg-info-surface', iconColor: 'text-info', role: 'status' },
  success: { icon: 'check', box: 'border-success-line bg-success-surface', iconColor: 'text-success', role: 'status' },
  warning: { icon: 'warning', box: 'border-warning-line bg-warning-surface', iconColor: 'text-warning', role: 'status' },
  danger: { icon: 'danger', box: 'border-danger-line bg-danger-surface', iconColor: 'text-danger', role: 'alert' },
};

/**
 * El título nombra la condición ("Sin conexión"); el cuerpo, el próximo paso.
 * Máximo una acción (`action`). Sin barra lateral, sin sombra.
 */
export default function Alert({ tone = 'info', title, meta, action, role, className = '', children }) {
  const config = TONES[tone];

  return (
    <div
      role={role ?? config.role}
      className={`flex max-w-[720px] gap-3 rounded-control border p-4 ${config.box} ${className}`}
    >
      <Icon name={config.icon} size={20} className={`mt-px ${config.iconColor}`} />
      <div className="min-w-0 flex-1">
        <p className="m-0 text-app-body font-semibold text-ink">{title}</p>
        {children && <div className="mt-0.5 text-app-body-sm text-ink-muted">{children}</div>}
        {meta && <p className="m-0 mt-1.5 font-mono text-app-label uppercase text-ink-faint">{meta}</p>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
