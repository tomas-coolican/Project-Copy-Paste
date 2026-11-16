import { sonCodigos } from '../utils/vuelos.js';
import Icon from './Icon.jsx';

/**
 * Origen → destino. Origen y destino son texto libre en la API: si ambos son códigos cortos
 * (EZE, COR) se muestran grandes; si son nombres ("Buenos Aires") se acomodan en el ancho disponible.
 * `variant="pass"` (pase de abordar) o `"ticket"` (talón del ticket, apilado cuando son nombres).
 */
export default function RouteLine({ origen, destino, variant = 'pass', className = '' }) {
  const codigos = sonCodigos(origen, destino);

  if (variant === 'ticket' && !codigos) {
    return (
      <p
        className={`m-0 flex flex-col gap-2 text-[clamp(1.7rem,2.6vw,2.3rem)] font-semibold leading-none tracking-[-0.04em] ${className}`}
      >
        <span className="break-words">{origen}</span>
        <span className="sr-only"> a </span>
        <Icon name="plane" size={20} className="text-accent" />
        <span className="break-words">{destino}</span>
      </p>
    );
  }

  const size =
    variant === 'ticket'
      ? 'text-[clamp(2.2rem,3.6vw,3.2rem)] font-semibold max-sm:text-[2.4rem] max-[420px]:text-[2.1rem]'
      : codigos
        ? 'font-mono text-[30px] font-medium max-[420px]:text-[27px]'
        : 'text-app-title';

  return (
    <p
      className={`m-0 flex items-center gap-2.5 leading-none tracking-[-0.04em] ${size} ${className}`}
    >
      <span className={codigos || variant === 'pass' ? 'min-w-0 shrink' : 'min-w-0 max-w-[40%] break-words leading-[1.1]'}>{origen}</span>
      <span className="sr-only"> a </span>
      {variant === 'pass' ? (
        <span aria-hidden="true" className="flex min-w-0 flex-1 items-center gap-[7px] text-accent">
          <span className="h-0 flex-1 border-t border-dashed border-line-strong" />
          <Icon name="plane" size={20} />
          <span className="h-0 flex-1 border-t border-dashed border-line-strong" />
        </span>
      ) : (
        <Icon name="plane" size={20} className="text-accent" />
      )}
      <span className={codigos || variant === 'pass' ? 'min-w-0 shrink' : 'min-w-0 max-w-[40%] break-words text-right leading-[1.1]'}>{destino}</span>
    </p>
  );
}
