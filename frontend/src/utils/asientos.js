// Presentación del mapa: la API devuelve `numero` secuencial ("01", "02"…), no fila+letra.
// Las filas son una agrupación visual: cada categoría se ordena por número y se corta en filas
// (Ejecutivo 2+2, Turista 3+3). Los rótulos E1…/T1… son nombres de grupo, no datos de la API.
export const CABINAS = [
  { categoria: 'Ejecutivo', codigo: 'E', porFila: 4, disposicion: '2+2' },
  { categoria: 'Turista', codigo: 'T', porFila: 6, disposicion: '3+3' },
];

function ordenNumerico(a, b) {
  return a.numero.localeCompare(b.numero, 'es', { numeric: true });
}

/** [{ categoria, codigo, porFila, disposicion, asientos, filas: [{ etiqueta, asientos }] }] sin cabinas vacías. */
export function agruparEnFilas(asientos) {
  return CABINAS.map((cabina) => {
    const propios = asientos.filter((a) => a.categoria === cabina.categoria).sort(ordenNumerico);
    const filas = [];

    for (let i = 0; i < propios.length; i += cabina.porFila) {
      filas.push({ etiqueta: `${cabina.codigo}${filas.length + 1}`, asientos: propios.slice(i, i + cabina.porFila) });
    }

    return { ...cabina, asientos: propios, filas };
  }).filter((grupo) => grupo.asientos.length > 0);
}

/** Etiqueta de la fila (E1, T4…) de un asiento, o null si no está en el mapa. */
export function etiquetaDeFila(grupos, asientoId) {
  for (const grupo of grupos) {
    const fila = grupo.filas.find((f) => f.asientos.some((a) => a.id === asientoId));
    if (fila) return fila.etiqueta;
  }

  return null;
}
