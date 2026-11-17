// Paginación en el navegador para listas que ya están filtradas en memoria.

export const TAMANIO_PAGINA = 10;

export function totalPaginas(total, tamanio = TAMANIO_PAGINA) {
  return Math.max(1, Math.ceil(total / tamanio));
}

/**
 * Devuelve la página pedida de `lista`. Si la página quedó fuera de rango (por ejemplo, después de
 * filtrar o cancelar), se ajusta a la última que existe en lugar de mostrar una página vacía.
 */
export function paginar(lista, pagina, tamanio = TAMANIO_PAGINA) {
  const paginas = totalPaginas(lista.length, tamanio);
  const actual = Math.min(Math.max(1, pagina), paginas);
  const desde = (actual - 1) * tamanio;

  return {
    items: lista.slice(desde, desde + tamanio),
    pagina: actual,
    totalPaginas: paginas,
    total: lista.length,
  };
}

/**
 * Números de página a mostrar, con "…" donde se saltean páginas.
 * Ej.: actual 6 de 12 → [1, '…', 5, 6, 7, '…', 12].
 */
export function numerosDePagina(actual, paginas) {
  if (paginas <= 7) return Array.from({ length: paginas }, (_, i) => i + 1);

  const numeros = new Set([1, paginas, actual - 1, actual, actual + 1]);
  const ordenados = [...numeros].filter((n) => n >= 1 && n <= paginas).sort((a, b) => a - b);

  return ordenados.flatMap((n, i) => (i > 0 && n - ordenados[i - 1] > 1 ? ['…', n] : [n]));
}
