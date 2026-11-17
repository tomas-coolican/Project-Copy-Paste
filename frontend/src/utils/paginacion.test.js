import { describe, expect, it } from 'vitest';
import { numerosDePagina, paginar, totalPaginas } from './paginacion.js';

const lista = Array.from({ length: 23 }, (_, i) => i + 1);

describe('totalPaginas', () => {
  it('redondea hacia arriba', () => {
    expect(totalPaginas(23, 10)).toBe(3);
    expect(totalPaginas(20, 10)).toBe(2);
  });

  it('siempre hay al menos una página, aunque la lista esté vacía', () => {
    expect(totalPaginas(0, 10)).toBe(1);
  });
});

describe('paginar', () => {
  it('devuelve los elementos de la página pedida', () => {
    const resultado = paginar(lista, 2, 10);

    expect(resultado.items).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(resultado).toMatchObject({ pagina: 2, totalPaginas: 3, total: 23 });
  });

  it('la última página puede tener menos elementos', () => {
    expect(paginar(lista, 3, 10).items).toEqual([21, 22, 23]);
  });

  it('si la página quedó fuera de rango, muestra la última que existe', () => {
    const resultado = paginar(lista.slice(0, 5), 4, 10);

    expect(resultado.pagina).toBe(1);
    expect(resultado.items).toHaveLength(5);
  });

  it('una página menor que 1 se toma como la primera', () => {
    expect(paginar(lista, 0, 10).pagina).toBe(1);
  });
});

describe('numerosDePagina', () => {
  it('con pocas páginas las muestra todas', () => {
    expect(numerosDePagina(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('con muchas páginas saltea con "…"', () => {
    expect(numerosDePagina(6, 12)).toEqual([1, '…', 5, 6, 7, '…', 12]);
  });

  it('al principio y al final no repite números', () => {
    expect(numerosDePagina(1, 12)).toEqual([1, 2, '…', 12]);
    expect(numerosDePagina(12, 12)).toEqual([1, '…', 11, 12]);
  });
});
