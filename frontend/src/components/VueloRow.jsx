import { Link } from 'react-router-dom';
import { formatFecha, formatHora } from '../utils/formatDate.js';
import { esHoy, esReservable } from '../utils/vuelos.js';
import Icon from './Icon.jsx';
import StatusIndicator from './StatusIndicator.jsx';

const GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-line-inverse py-4 transition-colors duration-(--duration-state) [grid-template-areas:'flight_status'_'route_route'_'time_seats'] hover:bg-surface-band/5 tbl:min-h-[68px] tbl:grid-cols-[96px_minmax(0,1fr)_84px_80px_130px_16px] tbl:gap-4 tbl:py-0 tbl:[grid-template-areas:'flight_route_time_seats_status_chevron']";

/** Fila de vuelo del tablero. Toda la fila es el enlace al detalle. */
export default function VueloRow({ vuelo, ahora, className = '' }) {
  const reservable = esReservable(vuelo, ahora);
  const fecha = vuelo.fechaSalida;

  return (
    <Link
      to={`/dashboard/vuelos/${vuelo.id}`}
      className={`group text-ink-inverse no-underline ${GRID} ${className}`}
    >
      <span className="[grid-area:flight] whitespace-nowrap font-mono text-app-data text-ink-inverse">
        {vuelo.numeroVuelo}
      </span>

      <span className="min-w-0 [grid-area:route]">
        <span className="flex items-center gap-1.5 text-[15px] font-semibold tracking-[-0.01em]">
          <span className="min-w-0 break-words">{vuelo.origen}</span>
          <span className="sr-only"> a </span>
          <Icon name="plane" size={12} className="text-accent" />
          <span className="min-w-0 break-words">{vuelo.destino}</span>
        </span>
      </span>

      <span className="[grid-area:time] self-end font-mono text-ink-inverse tbl:self-auto">
        <time dateTime={fecha?.toISOString()} className="block text-lg leading-none tracking-[-0.04em]">
          {formatHora(fecha)}
        </time>
        {fecha && !esHoy(fecha, ahora) && (
          <span className="mt-1 block text-app-label uppercase text-ink-inverse-muted">{formatFecha(fecha).slice(0, -5)}</span>
        )}
      </span>

      <span className="[grid-area:seats] self-end text-right font-mono text-app-data text-surface-band tbl:self-auto tbl:text-left">
        {vuelo.asientosDisponibles}
        <span className="tbl:hidden"> asientos</span>
      </span>

      <span className="[grid-area:status] flex flex-col items-end gap-1 tbl:items-start">
        <StatusIndicator estado={vuelo.estado} tone="ink" />
        {!reservable && (
          <span className="font-mono text-app-label uppercase text-ink-inverse-muted">No reservable</span>
        )}
      </span>

      <Icon
        name="chevron"
        size={16}
        className="hidden -rotate-90 text-ink-inverse-muted transition-transform duration-(--duration-state) group-hover:translate-x-1 tbl:block tbl:[grid-area:chevron]"
      />
    </Link>
  );
}
