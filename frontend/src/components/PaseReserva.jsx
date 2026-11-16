import { formatCurrency } from '../utils/formatCurrency.js';
import { formatFecha, formatHora } from '../utils/formatDate.js';
import BoardingPass from './BoardingPass.jsx';
import RouteLine from './RouteLine.jsx';
import StatusIndicator from './StatusIndicator.jsx';

/**
 * Pase de abordar de una reserva (comprobante). Usa el mismo BoardingPass del hero.
 * Toma los datos que trae la propia reserva (vuelo, asiento y pasajero anidados).
 */
export default function PaseReserva({ reserva, className = '' }) {
  const vuelo = reserva.vueloResumen;
  const salida = vuelo?.fechaSalida;

  return (
    <BoardingPass
      label="Pase de abordar"
      aria-label={`Pase de abordar de la reserva ${reserva.id}`}
      status={<StatusIndicator estado={reserva.estado} />}
      route={
        <>
          {vuelo && <RouteLine origen={vuelo.origen} destino={vuelo.destino} variant="pass" />}
          <p className="m-0 mt-3 font-mono text-app-label uppercase text-ink-faint">Pasajero</p>
          <p className="m-0 mt-0.5 text-app-body font-semibold">{reserva.nombrePasajero || '—'}</p>
          <p className="m-0 font-mono text-app-body-sm text-ink-muted">
            Doc. {reserva.documentoPasajero || '—'}
            {reserva.categoriaAsiento ? ` · ${reserva.categoriaAsiento}` : ''} · {formatCurrency(reserva.precioPagado)}
          </p>
        </>
      }
      fields={[
        { label: 'Vuelo', value: reserva.numeroVuelo || '—' },
        { label: 'Asiento', value: reserva.numeroAsiento || '—' },
        { label: 'Salida', value: salida ? formatHora(salida) : '—' },
      ]}
      serial={`Reserva ${reserva.id}${salida ? ` · ${formatFecha(salida)}` : ''}`}
      className={`max-w-[360px] ${className}`}
    />
  );
}
