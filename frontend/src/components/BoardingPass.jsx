import Barcode from './Barcode.jsx';

/**
 * Pase de abordar: pieza del hero (pase de operación) y del comprobante de reserva (S7).
 * `status`: nodo con el estado; `route`: nodo con la ruta; `fields`: [{ label, value }] (hasta 3);
 * `serial`: texto mono bajo el código de barras. `as` permite cambiar el elemento contenedor.
 */
export default function BoardingPass({ label = 'Pase de operación', status, route, fields = [], serial, className = '', ...rest }) {
  return (
    <article
      {...rest}
      className={`rounded-ticket bg-surface px-5 pb-4 pt-[18px] shadow-pass max-[420px]:px-4 max-[420px]:pb-3.5 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-dashed border-line-strong pb-3">
        <span className="font-mono text-app-label uppercase text-ink-faint">{label}</span>
        {status}
      </div>

      <div className="my-4">{route}</div>

      <dl className="m-0 grid grid-cols-3 gap-2.5 border-t border-line pt-3 max-[420px]:gap-[7px]">
        {fields.map(({ label: etiqueta, value }) => (
          <div key={etiqueta} className="flex min-w-0 flex-col gap-[3px]">
            <dt className="font-mono text-app-label uppercase text-ink-faint">{etiqueta}</dt>
            <dd className="m-0 whitespace-nowrap font-mono text-[15px] font-medium tracking-[-0.03em] max-[420px]:text-sm">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-3.5 pt-2.5">
        <div aria-hidden="true" className="mb-2.5 border-t border-dashed border-line-strong" />
        <Barcode />
        {serial && (
          <span className="mt-2 block text-right font-mono text-app-label uppercase tracking-[0.12em] text-ink-faint">
            {serial}
          </span>
        )}
      </div>
    </article>
  );
}
