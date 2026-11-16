// Selectores puros sobre la lista de vuelos ya adaptada (adaptVuelo).
// `ahora` llega de afuera (momento de la carga) para que nada dependa del reloj al renderizar.

function mismoDia(a, b) {
  return a.toDateString() === b.toDateString();
}

export function esHoy(fecha, ahora) {
  return Boolean(fecha) && mismoDia(fecha, ahora);
}

/** Se puede reservar: Programado y con salida futura. */
export function esReservable(vuelo, ahora) {
  return vuelo.estado === 'Programado' && Boolean(vuelo.fechaSalida) && vuelo.fechaSalida > ahora;
}

function ordenarPor(campo) {
  return (a, b) => a[campo] - b[campo];
}

/** Salidas por venir (y los vuelos ya en el aire), de la más próxima a la más lejana. */
export function proximasSalidas(vuelos, ahora) {
  return vuelos
    .filter((v) => v.fechaSalida && v.estado !== 'Finalizado' && (v.fechaSalida >= ahora || v.estado === 'En vuelo'))
    .sort(ordenarPor('fechaSalida'));
}

/** Llegadas por venir, de la más próxima a la más lejana. */
export function proximasLlegadas(vuelos, ahora) {
  return vuelos
    .filter((v) => v.fechaLlegada && v.estado !== 'Finalizado' && v.fechaLlegada >= ahora)
    .sort(ordenarPor('fechaLlegada'));
}

/** Primer vuelo de la lista que no esté cancelado. */
export function primeroOperativo(lista) {
  return lista.find((v) => v.estado !== 'Cancelado') ?? null;
}

/** Cifras de la landing, calculadas solo con lo que devuelve la API. */
export function resumirVuelos(vuelos, ahora) {
  const reservables = vuelos.filter((v) => esReservable(v, ahora));

  return {
    total: vuelos.length,
    programados: reservables.length,
    enVuelo: vuelos.filter((v) => v.estado === 'En vuelo').length,
    asientosLibres: reservables.reduce((suma, v) => suma + (v.asientosDisponibles ?? 0), 0),
  };
}

/** Los nombres de ruta son texto libre: solo los códigos cortos (EZE, COR) se muestran como código. */
export function sonCodigos(origen, destino) {
  return [origen, destino].every((texto) => typeof texto === 'string' && texto.trim().length > 0 && texto.trim().length <= 4);
}
