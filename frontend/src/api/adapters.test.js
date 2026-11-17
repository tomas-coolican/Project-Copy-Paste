import { describe, expect, it } from 'vitest';
import { adaptAsiento, adaptReserva, adaptVuelo, parseApiDate, toApiDateTime } from './adapters.js';

describe('parseApiDate', () => {
  it('una fecha sin zona horaria se interpreta como UTC', () => {
    expect(parseApiDate('2026-12-01T10:00:00').toISOString()).toBe('2026-12-01T10:00:00.000Z');
  });

  it('respeta la zona horaria si viene', () => {
    expect(parseApiDate('2026-12-01T10:00:00-03:00').toISOString()).toBe('2026-12-01T13:00:00.000Z');
  });

  it('devuelve null para valores vacíos o inválidos', () => {
    expect(parseApiDate(null)).toBeNull();
    expect(parseApiDate('')).toBeNull();
    expect(parseApiDate('no es una fecha')).toBeNull();
  });
});

describe('toApiDateTime', () => {
  it('convierte a ISO en UTC', () => {
    expect(toApiDateTime(new Date('2026-12-01T13:00:00Z'))).toBe('2026-12-01T13:00:00.000Z');
    expect(toApiDateTime('')).toBeNull();
  });
});

describe('adaptVuelo', () => {
  it('traduce el contrato de la API al modelo del frontend', () => {
    const vuelo = adaptVuelo({
      id: 7,
      codigo: 'AR1100',
      origen: 'Buenos Aires',
      destino: 'Córdoba',
      fechaSalida: '2026-12-01T10:00:00Z',
      fechaLlegada: '2026-12-01T11:20:00Z',
      precio: 48000,
      asientosTotales: 30,
      asientosDisponibles: 12,
      estado: 1,
    });

    expect(vuelo).toMatchObject({
      id: 7,
      numeroVuelo: 'AR1100',
      capacidad: 30,
      asientosDisponibles: 12,
      precioBase: 48000,
      estado: 'En vuelo',
      estadoCodigo: 1,
    });
    expect(vuelo.fechaSalida).toBeInstanceOf(Date);
  });

  it('un estado desconocido no rompe la pantalla', () => {
    expect(adaptVuelo({ id: 1, estado: 99 }).estado).toBe('Desconocido');
  });
});

describe('adaptAsiento', () => {
  it('traduce la categoría y la disponibilidad', () => {
    expect(adaptAsiento({ id: 3, numero: '01', categoria: 1, disponible: true })).toMatchObject({
      numero: '01',
      categoria: 'Ejecutivo',
      disponible: true,
      precio: null,
    });
  });
});

describe('adaptReserva', () => {
  const dto = {
    id: 15,
    fechaReserva: '2026-11-10T12:00:00Z',
    estado: 0,
    precioPagado: '72000.00',
    pasajeroId: 4,
    nombrePasajero: 'Ana Pérez',
    usuarioNombre: 'Ana',
    vuelo: { id: 7, codigo: 'AR1100', origen: 'Buenos Aires', destino: 'Córdoba', fechaSalida: '2026-12-01T10:00:00Z' },
    asiento: { id: 701, numero: '01', categoria: 1 },
    pasajero: { nombre: 'Ana', apellido: 'Pérez', documento: '30123456' },
  };

  it('aplana los datos anidados del vuelo, el asiento y el pasajero', () => {
    expect(adaptReserva(dto)).toMatchObject({
      id: 15,
      estado: 'Confirmada',
      precioPagado: 72000,
      vueloId: 7,
      numeroVuelo: 'AR1100',
      asientoId: 701,
      numeroAsiento: '01',
      categoriaAsiento: 'Ejecutivo',
      nombrePasajero: 'Ana Pérez',
      documentoPasajero: '30123456',
      origen: 'Buenos Aires',
      destino: 'Córdoba',
    });
  });

  it('si no viene nombrePasajero lo arma con nombre y apellido', () => {
    const { nombrePasajero, ...sinNombre } = dto;
    expect(nombrePasajero).toBe('Ana Pérez');
    expect(adaptReserva(sinNombre).nombrePasajero).toBe('Ana Pérez');
  });
});
