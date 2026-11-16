import Icon from './Icon.jsx';

const PASOS = ['Asiento', 'Pasajero', 'Resumen', 'Comprobante'];

/** Indicador de pasos del flujo de reserva. `actual`: 0 asiento, 1 pasajero, 2 resumen (se confirma acá), 3 comprobante. */
export default function ReservaPasos({ actual, className = '' }) {
  return (
    <ol aria-label="Pasos de la reserva" className={`m-0 flex list-none flex-wrap items-center gap-x-5 gap-y-2 p-0 ${className}`}>
      {PASOS.map((nombre, indice) => {
        const hecho = indice < actual;
        const activo = indice === actual;
        const marca = hecho
          ? 'border-ink bg-ink text-ink-inverse'
          : activo
            ? 'border-accent text-ink'
            : 'border-line-strong text-ink-faint';

        return (
          <li key={nombre} aria-current={activo ? 'step' : undefined} className="flex items-center gap-2">
            <span aria-hidden="true" className={`grid size-6 place-items-center rounded-full border font-mono text-app-label tracking-normal ${marca}`}>
              {hecho ? <Icon name="tick" size={12} /> : indice + 1}
            </span>
            <span className={`font-mono text-app-label uppercase ${activo ? 'text-ink' : 'text-ink-faint'}`}>
              {nombre}
              {hecho && <span className="sr-only"> (completado)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
