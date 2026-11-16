import { useState } from 'react';
import { Link } from 'react-router-dom';
import PaseReserva from './PaseReserva.jsx';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatFechaHora } from '../utils/formatDate.js';
import Icon from './Icon.jsx';
import StatusIndicator from './StatusIndicator.jsx';
import TextLink from './TextLink.jsx';

function Ruta({ vuelo }) {
  if (!vuelo) {
    return <span className="text-app-body-sm text-ink-muted">Datos del vuelo no disponibles</span>;
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 font-semibold tracking-[-0.01em]">
      <span className="break-words">{vuelo.origen}</span>
      <span className="sr-only"> a </span>
      <Icon name="plane" size={12} className="text-accent" />
      <span className="break-words">{vuelo.destino}</span>
    </span>
  );
}

function Acciones({ reserva, cancelando, cancelada, onCancel, paseAbierto, onTogglePase }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 tbl:justify-end">
      <TextLink as={Link} to={`/dashboard/vuelos/${reserva.vueloId}`} size="sm">
        Ver detalle
      </TextLink>

      <button
        type="button"
        onClick={onTogglePase}
        aria-expanded={paseAbierto}
        aria-controls={`pase-${reserva.id}`}
        className="inline-flex min-h-(--size-touch) items-center border-b border-line-strong pb-0.5 font-sans text-app-body-sm font-medium text-ink transition-colors duration-(--duration-state) hover:border-ink"
      >
        {paseAbierto ? 'Ocultar pase' : 'Ver pase'}
      </button>

      {cancelada ? (
        <span className="text-app-label text-ink-muted">La reserva está cancelada.</span>
      ) : (
        <button
          type="button"
          onClick={() => onCancel?.(reserva)}
          disabled={cancelando}
          aria-label={`Cancelar reserva ${reserva.numeroVuelo}`}
          className="inline-flex min-h-(--size-touch) items-center border-b border-line-strong pb-0.5 font-sans text-app-body-sm font-medium text-danger transition-colors duration-(--duration-state) hover:border-danger disabled:cursor-not-allowed disabled:border-line disabled:text-ink-faint"
        >
          {cancelando ? 'Cancelando…' : 'Cancelar reserva'}
        </button>
      )}
    </div>
  );
}

export default function ReservaRow({ reserva, compact = false, cancelando = false, error, onCancel }) {
  const [paseAbierto, setPaseAbierto] = useState(false);
  const cancelada = reserva.estado === 'Cancelada';
  const salida = reserva.vuelo?.fechaSalida;

  if (compact) {
    return (
      <li className="grid gap-x-5 gap-y-2 border-b border-line py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-app-data text-ink">{reserva.numeroVuelo}</span>
            <StatusIndicator estado={reserva.estado} />
          </div>
          <p className="m-0 mt-1.5">
            <Ruta vuelo={reserva.vuelo} />
          </p>
          <p className="m-0 mt-1 text-app-body-sm text-ink-muted">
            {salida ? (
              <>
                Salida <time dateTime={salida.toISOString()}>{formatFechaHora(salida)}</time>
              </>
            ) : (
              <>Reserva del <time dateTime={reserva.fechaReserva?.toISOString()}>{formatFechaHora(reserva.fechaReserva)}</time></>
            )}{' '}
            · Asiento <span className="font-mono text-ink">{reserva.numeroAsiento || '—'}</span>
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <span className="font-mono text-app-data text-ink">{formatCurrency(reserva.precioPagado)}</span>
          <TextLink as={Link} to={`/dashboard/vuelos/${reserva.vueloId}`} size="sm">
            Ver vuelo
          </TextLink>
        </div>
      </li>
    );
  }

  return (
    <li
      id={`reserva-${reserva.id}`}
      tabIndex={-1}
      className="border-b border-line transition-colors duration-(--duration-state) hover:bg-surface-tint focus-within:ring-1 focus-within:ring-inset focus-within:ring-ink"
    >
      <div className="grid gap-x-5 gap-y-3 px-1 py-4 tbl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_auto] tbl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-app-data text-ink">{reserva.numeroVuelo}</span>
            <StatusIndicator estado={reserva.estado} />
          </div>
          <p className="m-0 mt-1.5">
            <Ruta vuelo={reserva.vuelo} />
          </p>
          <p className="m-0 mt-0.5 text-app-body-sm text-ink-muted">{reserva.nombrePasajero || 'Pasajero sin nombre'}</p>
        </div>

        <div className="font-mono text-app-body-sm text-ink">
          <p className="m-0">
            <span className="text-app-label uppercase text-ink-faint">Salida </span>
            {salida ? <time dateTime={salida.toISOString()}>{formatFechaHora(salida)}</time> : '—'}
          </p>
          <p className="m-0 mt-1">
            <span className="text-app-label uppercase text-ink-faint">Asiento </span>
            {reserva.numeroAsiento || '—'}
            <span className="mx-2 text-line-strong">·</span>
            <span className="text-app-label uppercase text-ink-faint">Pagado </span>
            {formatCurrency(reserva.precioPagado)}
          </p>
          <p className="m-0 mt-1 text-app-label text-ink-muted">
            Reservada el {formatFechaHora(reserva.fechaReserva)}
          </p>
        </div>

        <Acciones
          reserva={reserva}
          cancelando={cancelando}
          cancelada={cancelada}
          onCancel={onCancel}
          paseAbierto={paseAbierto}
          onTogglePase={() => setPaseAbierto((abierto) => !abierto)}
        />
      </div>

      {paseAbierto && (
        <div id={`pase-${reserva.id}`} className="px-1 pb-6 pt-1">
          <PaseReserva reserva={reserva} />
        </div>
      )}

      {error && (
        <p role="alert" className="m-0 px-1 pb-4 text-app-body-sm text-danger">
          {error.message}
        </p>
      )}
    </li>
  );
}
