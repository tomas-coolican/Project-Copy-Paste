import { describe, expect, it } from 'vitest';
import { esReservable, primeroOperativo, proximasSalidas, resumirVuelos } from './vuelos.js';

const ahora = new Date('2026-11-16T12:00:00Z');
const horas = (h) => new Date(ahora.getTime() + h * 3_600_000);

const vuelo = (id, estado, salidaEnHoras, disponibles = 10) => ({
  id,
  estado,
  fechaSalida: horas(salidaEnHoras),
  fechaLlegada: horas(salidaEnHoras + 2),
  asientosDisponibles: disponibles,
});

describe('esReservable', () => {
  it('solo los vuelos programados con salida futura', () => {
    expect(esReservable(vuelo(1, 'Programado', 5), ahora)).toBe(true);
    expect(esReservable(vuelo(2, 'Programado', -1), ahora)).toBe(false);
    expect(esReservable(vuelo(3, 'Cancelado', 5), ahora)).toBe(false);
  });
});

describe('proximasSalidas', () => {
  it('ordena por salida y deja afuera los finalizados y los que ya salieron', () => {
    const lista = [
      vuelo(1, 'Programado', 10),
      vuelo(2, 'Finalizado', -10),
      vuelo(3, 'En vuelo', -1),
      vuelo(4, 'Programado', 2),
      vuelo(5, 'Programado', -3),
    ];

    expect(proximasSalidas(lista, ahora).map((v) => v.id)).toEqual([3, 4, 1]);
  });
});

describe('primeroOperativo', () => {
  it('saltea los cancelados', () => {
    expect(primeroOperativo([vuelo(1, 'Cancelado', 1), vuelo(2, 'Programado', 2)]).id).toBe(2);
    expect(primeroOperativo([])).toBeNull();
  });
});

describe('resumirVuelos', () => {
  it('cuenta solo los asientos libres de vuelos reservables', () => {
    const lista = [
      vuelo(1, 'Programado', 5, 10),
      vuelo(2, 'Programado', 8, 4),
      vuelo(3, 'Cancelado', 5, 30),
      vuelo(4, 'En vuelo', -1, 2),
    ];

    expect(resumirVuelos(lista, ahora)).toEqual({ total: 4, programados: 2, enVuelo: 1, asientosLibres: 14 });
  });
});
