// Las fechas llegan en UTC y se muestran siempre en hora local, en es-AR.
const SIN_DATO = '—';

const FECHA = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });

function partes(formateador, fecha) {
  return Object.fromEntries(formateador.formatToParts(fecha).map(({ type, value }) => [type, value]));
}
const FECHA_LARGA = new Intl.DateTimeFormat('es-AR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const HORA = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

function esValida(fecha) {
  return fecha instanceof Date && !Number.isNaN(fecha.getTime());
}

/** "15 nov 2026" */
export function formatFecha(fecha) {
  if (!esValida(fecha)) return SIN_DATO;

  const { day, month, year } = partes(FECHA, fecha);
  return `${day} ${month.replace('.', '')} ${year}`;
}

/** "domingo, 15 de noviembre de 2026" */
export function formatFechaLarga(fecha) {
  return esValida(fecha) ? FECHA_LARGA.format(fecha) : SIN_DATO;
}

/** "08:20" */
export function formatHora(fecha) {
  return esValida(fecha) ? HORA.format(fecha) : SIN_DATO;
}

/** "15 nov 2026, 08:20" */
export function formatFechaHora(fecha) {
  return esValida(fecha) ? `${formatFecha(fecha)}, ${formatHora(fecha)}` : SIN_DATO;
}
