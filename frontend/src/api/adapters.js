export const ESTADO_VUELO = Object.freeze({
  0: 'Programado',
  1: 'En vuelo',
  2: 'Cancelado',
  3: 'Finalizado',
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
    numeroVuelo: dto.numeroVuelo,
    origen: dto.origen,
    destino: dto.destino,
    fechaSalida: parseApiDate(dto.fechaSalida),
    fechaLlegada: parseApiDate(dto.fechaLlegada),
    capacidad: dto.capacidad,
    asientosDisponibles: dto.asientosDisponibles,
    precioBase: Number(dto.precioBase),
    estado: getEnumLabel(ESTADO_VUELO, dto.estado),
    estadoCodigo: dto.estado,
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
