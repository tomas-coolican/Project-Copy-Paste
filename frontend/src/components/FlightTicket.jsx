import useReveal from '../hooks/useReveal.js';
import { formatMonto } from '../utils/formatCurrency.js';
import { formatDuracion, formatFecha, formatFechaLarga, formatHora } from '../utils/formatDate.js';
import { sonCodigos } from '../utils/vuelos.js';
import Barcode from './Barcode.jsx';
import RouteLine from './RouteLine.jsx';
import StatusIndicator from './StatusIndicator.jsx';

const LABEL = 'block font-mono text-app-label uppercase text-ink-faint';

function Campo({ label, className = '', children }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <dt className={LABEL}>{label}</dt>
      <dd className="m-0 flex flex-col gap-1">{children}</dd>
    </div>
  );
}

// Triángulos opuestos que simulan el troquel; toman el color de la banda que rodea al ticket.
// En horizontal (apilado, < 760 px) quedan en los extremos izquierdo y derecho.
const TROQUEL =
  "relative z-[2] h-px w-full border-t border-dashed border-line-strong before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[11px] before:-translate-y-1/2 before:bg-surface-band before:content-[''] before:[clip-path:polygon(0_0,100%_50%,0_100%)] after:absolute after:right-0 after:top-1/2 after:h-5 after:w-[11px] after:-translate-y-1/2 after:bg-surface-band after:content-[''] after:[clip-path:polygon(100%_0,0_50%,100%_100%)] tbl:h-auto tbl:w-px tbl:border-l tbl:border-t-0 tbl:before:left-1/2 tbl:before:top-0 tbl:before:h-[11px] tbl:before:w-5 tbl:before:-translate-x-1/2 tbl:before:translate-y-0 tbl:before:[clip-path:polygon(0_0,100%_0,50%_100%)] tbl:after:bottom-0 tbl:after:left-1/2 tbl:after:right-auto tbl:after:top-auto tbl:after:h-[11px] tbl:after:w-5 tbl:after:-translate-x-1/2 tbl:after:translate-y-0 tbl:after:[clip-path:polygon(0_100%,100%_100%,50%_0)]";

/**
 * Ficha del vuelo: talón (código, ruta, código de barras) + cuerpo (horarios, asientos, precio).
 * Va sobre banda `surface-band` (los troqueles toman ese color). `footer`: nodo para el pie.
 * `reveal`: el ticket "se imprime" de izquierda a derecha al entrar en pantalla.
 */
export default function FlightTicket({ vuelo, footer, reveal = false, className = '', ...rest }) {
  const [ref, visible] = useReveal();
  const codigos = sonCodigos(vuelo.origen, vuelo.destino);
  const serial = `${vuelo.numeroVuelo.replace(/\s+/g, '')} · ${formatFecha(vuelo.fechaSalida)}`;
  const animacion = reveal ? (visible ? 'animate-ticket-print' : 'opacity-0') : '';

  return (
    <article
      ref={ref}
      {...rest}
      className={`grid grid-cols-1 grid-rows-[auto_1px_auto] overflow-hidden rounded-ticket bg-surface shadow-soft tbl:grid-cols-[minmax(0,0.62fr)_1px_minmax(0,1.38fr)] tbl:grid-rows-none ${animacion} ${className}`}
    >
      <div className="flex flex-col gap-[18px] bg-surface-tint p-[clamp(24px,3vw,36px)] tbl:min-h-[370px] tbl:gap-[22px]">
        <div>
          <span className={LABEL}>Vuelo</span>
          <span className="mt-1.5 block font-mono text-[clamp(1.7rem,3vw,2.6rem)] font-medium leading-none tracking-[-0.04em]">
            {vuelo.numeroVuelo}
          </span>
        </div>
        <RouteLine origen={vuelo.origen} destino={vuelo.destino} variant="ticket" />
        <span className="text-app-body-sm text-ink-muted">
          {codigos ? 'Salida el ' : 'Sale el '}
          {formatFechaLarga(vuelo.fechaSalida)}
        </span>
        <div aria-hidden="true" className="mt-auto">
          <Barcode />
        </div>
        <span aria-hidden="true" className="font-mono text-app-label uppercase tracking-[0.12em] text-ink-faint">
          {serial}
        </span>
      </div>

      <div aria-hidden="true" className={TROQUEL} />

      <div className="flex flex-col justify-between gap-6 p-[clamp(24px,3vw,36px)] tbl:gap-7">
        <dl className="m-0 grid grid-cols-2 gap-4 border-b border-line pb-5 tbl:grid-cols-4 max-[360px]:grid-cols-1 max-[360px]:gap-3">
          <Campo label="Estado">
            <StatusIndicator estado={vuelo.estado} size="md" />
          </Campo>
          <Campo label="Salida">
            <span className="whitespace-nowrap font-mono text-lg font-medium tracking-[-0.04em]">{formatHora(vuelo.fechaSalida)}</span>
          </Campo>
          <Campo label="Llegada">
            <span className="whitespace-nowrap font-mono text-lg font-medium tracking-[-0.04em]">{formatHora(vuelo.fechaLlegada)}</span>
          </Campo>
          <Campo label="Duración">
            <span className="whitespace-nowrap font-mono text-lg font-medium tracking-[-0.04em]">
              {formatDuracion(vuelo.fechaSalida, vuelo.fechaLlegada)}
            </span>
          </Campo>
        </dl>

        <dl className="m-0 grid flex-1 grid-cols-1 items-end gap-[18px] pb-2 pt-1 sm:grid-cols-2 sm:gap-x-[30px] sm:gap-y-[22px]">
          <Campo label="Asientos disponibles">
            <span className="font-mono text-[clamp(2.7rem,4.6vw,4.2rem)] font-medium leading-[0.9] tracking-[-0.04em]">
              {vuelo.asientosDisponibles}
            </span>
            <span className="mt-0.5 font-mono text-app-label uppercase text-ink-faint">de {vuelo.capacidad}</span>
          </Campo>
          <Campo label="Precio base">
            <span className="font-mono text-[clamp(2.7rem,4.6vw,4.2rem)] font-medium leading-[0.9] tracking-[-0.04em]">
              {formatMonto(vuelo.precioBase)}
            </span>
            <span className="mt-0.5 font-mono text-app-label uppercase text-ink-faint">ARS</span>
          </Campo>
          <Campo label="Capacidad" className="border-t border-dashed border-line-strong pt-3.5 sm:pt-4">
            <span className="mt-1 font-mono text-[19px] font-medium tracking-[-0.04em]">{vuelo.capacidad}</span>
          </Campo>
          <Campo label="Asientos ocupados" className="border-t border-dashed border-line-strong pt-3.5 sm:pt-4">
            <span className="mt-1 font-mono text-[19px] font-medium tracking-[-0.04em]">
              {Math.max(vuelo.capacidad - vuelo.asientosDisponibles, 0)}
            </span>
          </Campo>
        </dl>

        {footer && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-3.5 text-app-label text-ink-faint">
            {footer}
          </div>
        )}
      </div>
    </article>
  );
}
