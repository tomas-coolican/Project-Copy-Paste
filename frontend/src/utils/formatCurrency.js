// Único lugar donde se formatea dinero: pesos argentinos.
const ENTERO = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});
const CON_CENTAVOS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "$ 48.000" · "$ 72.000,50" */
export function formatCurrency(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '—';

  return (Number.isInteger(numero) ? ENTERO : CON_CENTAVOS).format(numero);
}

const SOLO_NUMERO = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

/** "48.000": el monto sin símbolo, para cifras grandes con la moneda en una etiqueta aparte. */
export function formatMonto(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? SOLO_NUMERO.format(numero) : '—';
}
