export const ESTADO_VUELO = Object.freeze({
  0: 'Programado',
  1: 'En vuelo',
  2: 'Cancelado',
  3: 'Finalizado',
});

export const ESTADO_RESERVA = Object.freeze({
  0: 'Confirmada',
  1: 'Cancelada',
});

export const CATEGORIA_ASIENTO = Object.freeze({
  0: 'Turista',
  1: 'Ejecutivo',
});

const ZONA_HORARIA_AL_FINAL = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;

export function getEnumLabel(mapa, valor, alternativo = 'Desconocido') {
  return mapa[valor] ?? alternativo;
}

export function parseApiDate(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string') return null;

  const fecha = new Date(ZONA_HORARIA_AL_FINAL.test(value) ? value : `${value}Z`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function toApiDateTime(value) {
  if (value === null || value === undefined || value === '') return null;

  const fecha = value instanceof Date ? value : new Date(value);
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
}

export function adaptVuelo(dto) {
  return {
    id: dto.id,
    numeroVuelo: dto.codigo ?? dto.numeroVuelo ?? '',
    origen: dto.origen,
    destino: dto.destino,
    fechaSalida: parseApiDate(dto.fechaSalida),
    fechaLlegada: parseApiDate(dto.fechaLlegada),
    capacidad: dto.asientosTotales ?? dto.capacidad ?? 0,
    asientosDisponibles: dto.asientosDisponibles ?? 0,
    precioBase: Number(dto.precio ?? dto.precioBase ?? 0),
    estado: getEnumLabel(ESTADO_VUELO, dto.estado),
    estadoCodigo: dto.estado,
  };
}

export function adaptAsiento(dto) {
  return {
    id: dto.id,
    numero: String(dto.numero ?? ''),
    categoria: getEnumLabel(CATEGORIA_ASIENTO, dto.categoria),
    categoriaCodigo: dto.categoria,
    disponible: Boolean(dto.disponible),
  };
}

/** GET /vuelos/{id}: el vuelo y la lista de asientos con su disponibilidad. */
export function adaptVueloDetalle(dto) {
  return {
    vuelo: adaptVuelo(dto),
    asientos: (dto.asientos ?? []).map(adaptAsiento),
  };
}

export function adaptReserva(dto) {
  return {
    id: dto.id,
    fechaReserva: parseApiDate(dto.fechaReserva),
    estado: getEnumLabel(ESTADO_RESERVA, dto.estado),
    estadoCodigo: dto.estado,
    precioPagado: Number(dto.precioPagado),
    pasajeroId: dto.pasajeroId,
    nombrePasajero: dto.nombrePasajero,
    vueloId: dto.vuelo?.id ?? dto.vueloId,
    numeroVuelo: dto.vuelo?.codigo ?? dto.numeroVuelo ?? '',
    asientoId: dto.asiento?.id ?? dto.asientoId,
    numeroAsiento: dto.asiento?.numero ?? dto.numeroAsiento ?? '',
    categoriaAsiento: getEnumLabel(CATEGORIA_ASIENTO, dto.asiento?.categoria, ''),
    origen: dto.vuelo?.origen ?? '',
    destino: dto.vuelo?.destino ?? '',
    fechaSalida: parseApiDate(dto.vuelo?.fechaSalida),
  };
}

export function adaptPasajero(dto) {
  const nombre = dto.nombre ?? '';
  const apellido = dto.apellido ?? '';

  return {
    id: dto.id,
    nombre,
    apellido,
    dni: dto.dni,
    email: dto.email,
    telefono: dto.telefono ?? null,
    nombreCompleto: `${nombre} ${apellido}`.trim(),
  };
}

export function adaptSesion(dto) {
  return {
    token: dto.token,
    expiraEn: parseApiDate(dto.expiraEn),
    usuario: {
      id: dto.usuario.id,
      nombre: dto.usuario.nombre,
      email: dto.usuario.email,
      rol: dto.usuario.rol,
    },
  };
}
