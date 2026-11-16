import { formatHora } from '../../utils/formatDate.js';

const DIVIDER = 'border-dashed border-line-strong';

// Posición de cada cifra en la grilla de 2 × 2 (620–900 px) y en la fila de 5 columnas (≥ 900 px).
function clasesCifra(indice, ultima) {
  const columnaIzquierda = indice % 2 === 0;
  return [
    // < 620 px: filas con etiqueta a la izquierda y cifra a la derecha.
    `flex items-baseline justify-between gap-[18px] border-b py-3.5 ${DIVIDER}`,
    ultima ? 'border-b-0' : '',
    // 620–900 px
    `sm:block sm:py-4 ${columnaIzquierda ? `sm:border-r sm:pl-0 sm:pr-[18px] ${DIVIDER}` : 'sm:border-r-0 sm:pl-[18px] sm:pr-0'}`,
    indice >= 2 ? 'sm:border-b-0' : '',
    // ≥ 900 px
    `md:border-b-0 md:py-5 md:pl-[22px] md:pr-[22px] ${ultima ? 'md:border-r-0' : `md:border-r ${DIVIDER}`}`,
  ].join(' ');
}

function Cifra({ label, children, indice, ultima }) {
  return (
    <div className={clasesCifra(indice, ultima)}>
      <dt className="block font-mono text-app-label uppercase text-ink-muted">{label}</dt>
      <dd className="m-0 mt-1.5 block font-mono text-[1.9rem] font-medium leading-none tracking-[-0.04em] sm:text-[clamp(1.9rem,2.6vw,2.45rem)] max-sm:mt-0">
        {children}
      </dd>
    </div>
  );
}

const ENTERO = new Intl.NumberFormat('es-AR');

/**
 * Cifras calculadas con GET /api/vuelos (`resumirVuelos`). Mientras cargan o si la API falla,
 * se muestra "—" en lugar de un número inventado.
 */
export default function StatsBand({ resumen, actualizado }) {
  const cifra = (valor) => (resumen ? ENTERO.format(valor) : '—');
  const valores = [
    ['Vuelos', cifra(resumen?.total)],
    ['Programados', cifra(resumen?.programados)],
    ['En vuelo', cifra(resumen?.enVuelo)],
    ['Asientos libres', cifra(resumen?.asientosLibres)],
  ];

  return (
    <section aria-label="Resumen de la operación" className="bg-surface-band">
      <div className="mx-auto grid w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.16fr_repeat(4,1fr)]">
        <div className={`flex items-baseline justify-between gap-1.5 border-b py-4 ${DIVIDER} sm:col-span-2 sm:py-[18px] md:col-span-1 md:flex-col md:items-stretch md:justify-between md:border-b-0 md:border-r md:py-[22px] md:pl-0 md:pr-6`}>
          <span className="font-mono text-app-label uppercase tracking-[0.1em]">Operación</span>
          <span className="text-app-label text-ink-muted">
            {actualizado ? `Actualizado ${formatHora(actualizado)}` : 'Cargando datos…'}
          </span>
        </div>
        <dl className="contents m-0">
          {valores.map(([label, valor], indice) => (
            <Cifra key={label} label={label} indice={indice} ultima={indice === valores.length - 1}>
              {valor}
            </Cifra>
          ))}
        </dl>
      </div>
    </section>
  );
}
