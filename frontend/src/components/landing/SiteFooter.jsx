import { SECCIONES } from "./secciones.js";

const ANIO = new Date().getFullYear();

export default function SiteFooter() {
  return (
    <footer className="bg-surface pb-6">
      <div className="mx-auto w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))]">
        <div className="flex flex-col items-start gap-5 border-b border-line py-[26px] tbl:flex-row tbl:items-center tbl:justify-between tbl:gap-6">
          <div className="flex flex-wrap items-baseline gap-2 min-[420px]:gap-3">
            <span className="text-xl font-bold leading-none tracking-[-0.04em]">
              Vuelos
            </span>
            <span className="font-mono text-app-label uppercase tracking-[0.1em] text-ink-faint min-[420px]:border-l min-[420px]:border-line-strong min-[420px]:pl-3">
              Sistema de gestión
            </span>
          </div>
          <nav
            aria-label="Pie de página"
            className="flex flex-wrap gap-x-[18px] gap-y-2 sm:gap-x-[22px] sm:gap-y-2.5"
          >
            {SECCIONES.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="text-app-label text-ink-muted no-underline decoration-accent underline-offset-[3px] transition-colors duration-(--duration-state) hover:text-ink hover:underline"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-2 pt-[18px] font-mono text-app-label uppercase tracking-[0.06em] text-ink-faint tbl:flex-row tbl:justify-between tbl:gap-4">
          <span>Proyecto Integrador Programación IV</span>
          <span>{ANIO}</span>
        </div>
      </div>
    </footer>
  );
}
