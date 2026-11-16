import { formatCurrency } from '../utils/formatCurrency.js';
import { formatFechaHora } from '../utils/formatDate.js';

const LABEL = 'font-mono text-app-label uppercase text-ink-faint';

function Fila({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5">
      <dt className={LABEL}>{label}</dt>
      <dd className="m-0 min-w-0 break-words text-right font-mono text-app-data">{children}</dd>
    </div>
  );
}

/**
 * Resumen de la reserva en curso. En escritorio es un riel fijo de 320 px; por debajo de 900 px
 * pasa a una barra inferior con el asiento y la acción. `actions` va en el riel; `barAction`, en la barra.
 * Si el asiento trae `precio` (la API todavía no lo informa) se muestra ese; si no, el precio base
 * y un aviso: el recargo por categoría lo calcula el servidor al crear la reserva.
 */
export default function ReservaResumen({ vuelo, asiento, etiquetaFila, pasajero, actions, barAction }) {
  const conPrecio = asiento?.precio !== null && asiento?.precio !== undefined;
  const detalle = asiento ? `${asiento.categoria}${etiquetaFila ? ` · fila ${etiquetaFila}` : ''}` : 'Elegí un asiento libre';

  return (
    <>
      <aside aria-label="Resumen de la reserva" className="hidden md:sticky md:top-23 md:block md:self-start">
        <div className="border-t border-ink pt-4">
          <span className={LABEL}>Tu reserva</span>
          <p className="m-0 mt-1 text-app-title">Asiento</p>
          <p className="m-0 mt-3 font-mono text-[2.4rem] font-medium leading-none tracking-[-0.04em]">
            {asiento ? asiento.numero : '—'}
          </p>
          <p className="m-0 mt-1.5 text-app-body-sm text-ink-muted">{detalle}</p>

          <dl className="m-0 mt-5 border-t border-dashed border-line-strong">
            <Fila label="Vuelo">{vuelo.numeroVuelo}</Fila>
            <Fila label="Ruta">
              {vuelo.origen} → {vuelo.destino}
            </Fila>
            <Fila label="Salida">{formatFechaHora(vuelo.fechaSalida)}</Fila>
            <Fila label={conPrecio ? 'Precio' : 'Precio base'}>{formatCurrency(conPrecio ? asiento.precio : vuelo.precioBase)}</Fila>
            {pasajero && <Fila label="Pasajero">{pasajero}</Fila>}
          </dl>

          <div className="mt-5 flex flex-col items-start gap-3">{actions}</div>
          {!conPrecio && (
            <p className="m-0 mt-4 text-app-body-sm text-ink-faint">
              El precio final depende de la categoría y lo calcula el servidor al crear la reserva: lo vas a ver en el
              comprobante.
            </p>
          )}
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-40 flex min-h-18 items-center justify-between gap-4 border-t border-line-strong bg-surface px-gutter py-3 md:hidden">
        <div className="min-w-0">
          <span className={LABEL}>Asiento</span>
          <p className="m-0 font-mono text-app-data-lg">{asiento ? asiento.numero : '—'}</p>
        </div>
        <p className="m-0 min-w-0 text-right font-mono text-app-data text-ink-muted">
          {asiento ? asiento.categoria : 'Sin elegir'}
        </p>
        {barAction}
      </div>
    </>
  );
}
