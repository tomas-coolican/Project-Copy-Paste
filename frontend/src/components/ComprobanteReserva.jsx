import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatFecha, formatHora } from '../utils/formatDate.js';
import Alert from './Alert.jsx';
import BoardingPass from './BoardingPass.jsx';
import Button from './Button.jsx';
import RouteLine from './RouteLine.jsx';
import StatusIndicator from './StatusIndicator.jsx';
import TextLink from './TextLink.jsx';

/** Comprobante de una reserva recién creada, con los datos que devolvió POST /reservas. */
export default function ComprobanteReserva({ reserva }) {
  const asiento = [reserva.numeroAsiento, reserva.categoriaAsiento].filter(Boolean).join(' · ');

  return (
    <div className="flex max-w-[720px] flex-col gap-8">
      <Alert tone="success" title={`Reserva ${reserva.numeroVuelo} confirmada`}>
        Asiento {asiento} · {formatCurrency(reserva.precioPagado)}. Podés cancelarla desde Mis reservas.
      </Alert>

      <BoardingPass
        label="Pase de reserva"
        aria-label={`Comprobante de la reserva ${reserva.numeroVuelo}`}
        status={<StatusIndicator estado={reserva.estado} size="md" />}
        route={<RouteLine origen={reserva.origen} destino={reserva.destino} />}
        fields={[
          { label: 'Pasajero', value: reserva.nombrePasajero, wide: true },
          { label: 'Asiento', value: asiento || '—' },
          { label: 'Fecha', value: formatFecha(reserva.fechaSalida) },
          { label: 'Salida', value: formatHora(reserva.fechaSalida) },
          { label: 'Vuelo', value: reserva.numeroVuelo },
          { label: 'Precio pagado', value: formatCurrency(reserva.precioPagado), wide: true },
        ]}
        serial={`R-${reserva.id}`}
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button as={Link} to="/dashboard/reservas" icon="arrow">
          Ver mis reservas
        </Button>
        <TextLink as={Link} to="/dashboard" icon={null}>
          Volver al tablero
        </TextLink>
      </div>
    </div>
  );
}
