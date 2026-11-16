import Icon from './Icon.jsx';

/**
 * Región plana, alineada a la izquierda, con una regla superior de 1 px.
 * El título empieza por la ausencia ("No hay vuelos para esta ruta"); el cuerpo dice qué hacer.
 * Si reemplaza una lista filtrada, `announce` lo anuncia una sola vez.
 */
export default function EmptyState({ title, action, announce = false, heading: Heading = 'h2', surface = 'light', className = '', children }) {
  const ink = surface === 'ink';

  return (
    <div
      role={announce ? 'status' : undefined}
      className={`max-w-[48ch] border-t py-12 ${ink ? 'border-line-inverse text-ink-inverse' : 'border-line'} ${className}`}
    >
      <Icon name="empty" size={24} className={ink ? 'text-ink-inverse-muted' : 'text-ink-muted'} />
      <Heading className="m-0 mt-3 text-app-title font-semibold">{title}</Heading>
      {children && <p className={`m-0 mt-1 text-app-body-sm ${ink ? 'text-ink-inverse-strong' : 'text-ink-muted'}`}>{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
