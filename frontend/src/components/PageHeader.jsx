/**
 * Cabecera de una pantalla de la aplicación. El breadcrumb es wayfinding (no un eyebrow):
 * ubica la pantalla dentro del tablero. `actions` queda alineado a la derecha.
 */
export default function PageHeader({ breadcrumb, title, lead, actions, className = '' }) {
  return (
    <header className={`flex flex-wrap items-end justify-between gap-x-8 gap-y-5 border-b border-line pb-6 ${className}`}>
      <div className="min-w-0">
        {breadcrumb && (
          <p className="m-0 mb-2 font-mono text-app-label uppercase text-ink-faint">{breadcrumb}</p>
        )}
        <h1 className="m-0 text-app-page font-bold">{title}</h1>
        {lead && <p className="m-0 mt-2 max-w-[58ch] text-app-body-sm text-ink-muted">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}
