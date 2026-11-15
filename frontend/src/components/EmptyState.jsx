import Icon from './Icon.jsx';

/**
 * Región plana, alineada a la izquierda, con una regla superior de 1 px.
 * El título empieza por la ausencia ("No hay vuelos para esta ruta"); el cuerpo dice qué hacer.
 * Si reemplaza una lista filtrada, `announce` lo anuncia una sola vez.
 */
export default function EmptyState({ title, action, announce = false, heading: Heading = 'h2', className = '', children }) {
  return (
    <div
      role={announce ? 'status' : undefined}
      className={`max-w-[48ch] border-t border-line py-12 ${className}`}
    >
      <Icon name="empty" size={24} className="text-ink-muted" />
      <Heading className="m-0 mt-3 text-app-title font-semibold">{title}</Heading>
      {children && <p className="m-0 mt-1 text-app-body-sm text-ink-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
