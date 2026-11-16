import { formatCurrency } from '../utils/formatCurrency.js';
import { formatFechaHora } from '../utils/formatDate.js';
import TextLink from './TextLink.jsx';

function Seccion({ titulo, onCambiar, accion, children }) {
  return (
    <section aria-label={titulo} className="border-t border-line py-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="m-0 text-app-title">{titulo}</h2>
        {onCambiar && (
          <TextLink as="button" type="button" icon={null} size="sm" onClick={onCambiar} aria-label={accion}>
            Cambiar
          </TextLink>
        )}
      </div>
      <dl className="m-0 mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Dato({ label, children, wide = false }) {
  return (
    <div className={`min-w-0 ${wide ? 'sm:col-span-2' : ''}`}>
      <dt className="font-mono text-app-label uppercase text-ink-faint">{label}</dt>
      <dd className="m-0 mt-0.5 break-words font-mono text-app-data text-ink">{children}</dd>
    </div>
  );
}

/**
 * Último control antes de confirmar: vuelo, pasajero, asiento y precio, con un "Cambiar" por bloque.
 * El precio es el del asiento si la API lo informa; si no, el precio base con el aviso correspondiente.
 */
export default function ResumenReserva({ vuelo, pasajero, asiento, etiquetaFila, onCambiarAsiento, onCambiarPasajero }) {
  const conPrecio = asiento.precio !== null && asiento.precio !== undefined;

  return (
    <div className="max-w-[640px]">
      <Seccion titulo="Vuelo">
        <Dato label="Vuelo">{vuelo.numeroVuelo}</Dato>
        <Dato label="Salida">{formatFechaHora(vuelo.fechaSalida)}</Dato>
        <Dato label="Ruta" wide>
          {vuelo.origen} → {vuelo.destino}
        </Dato>
      </Seccion>

      <Seccion titulo="Pasajero" onCambiar={onCambiarPasajero} accion="Cambiar el pasajero">
        <Dato label="Nombre" wide>
          {pasajero.nombreCompleto}
        </Dato>
        <Dato label="DNI">{pasajero.dni}</Dato>
        <Dato label="Email">{pasajero.email}</Dato>
        {pasajero.telefono && <Dato label="Teléfono">{pasajero.telefono}</Dato>}
      </Seccion>

      <Seccion titulo="Asiento" onCambiar={onCambiarAsiento} accion="Cambiar el asiento">
        <Dato label="Número">{asiento.numero}</Dato>
        <Dato label="Categoría">
          {asiento.categoria}
          {etiquetaFila ? ` · fila ${etiquetaFila}` : ''}
        </Dato>
      </Seccion>

      <section aria-label="Precio" className="border-t border-dashed border-line-strong pt-5">
        <span className="font-mono text-app-label uppercase text-ink-faint">{conPrecio ? 'Precio' : 'Precio base'}</span>
        <p className="m-0 mt-1 font-mono text-app-data-lg">{formatCurrency(conPrecio ? asiento.precio : vuelo.precioBase)}</p>
        {!conPrecio && (
          <p className="m-0 mt-2 max-w-[52ch] text-app-body-sm text-ink-muted">
            El precio final depende de la categoría y lo calcula el servidor al confirmar. El monto exacto aparece en
            el comprobante.
          </p>
        )}
      </section>
    </div>
  );
}
