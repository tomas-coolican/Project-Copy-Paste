// Anchos (en unidades) de barras y espacios alternados; es un adorno, no codifica nada.
const BARRAS = [2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 1, 3, 2, 1, 2, 1, 1, 3, 1, 2, 1, 2, 2, 1, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 2, 1, 3];

function construir() {
  let x = 0;
  const rects = [];

  BARRAS.forEach((ancho, indice) => {
    if (indice % 2 === 0) rects.push({ x, ancho });
    x += ancho;
  });

  return { rects, total: x };
}

const { rects, total } = construir();

/** Código de barras monocromo de 30 px de alto (ephemera del ticket). Hereda currentColor. */
export default function Barcode({ className = '' }) {
  return (
    <svg
      viewBox={`0 0 ${total} 30`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={`block h-[30px] w-full text-ink ${className}`}
    >
      {rects.map(({ x, ancho }) => (
        <rect key={x} x={x} y="0" width={ancho} height="30" fill="currentColor" />
      ))}
    </svg>
  );
}
