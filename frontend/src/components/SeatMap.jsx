import { useEffect, useMemo, useRef, useState } from 'react';
import { agruparEnFilas } from '../utils/asientos.js';
import Icon from './Icon.jsx';

const ASIENTO =
  'relative grid size-(--size-touch) shrink-0 place-items-center rounded-control border font-mono text-app-label tracking-normal transition-colors duration-(--duration-state)';
const LIBRE = 'cursor-pointer border-line-strong bg-surface text-ink hover:border-ink hover:bg-surface-tint';
const SELECCIONADO = 'cursor-pointer border-ink bg-ink text-ink-inverse';
// Ocupado: trama diagonal de 1 px + X; sigue en el recorrido del teclado para que se anuncie.
const OCUPADO =
  'cursor-not-allowed border-line bg-surface-tint text-ink-faint bg-[repeating-linear-gradient(135deg,var(--color-line)_0_1px,transparent_1px_6px)]';

function estadoDe(asiento, seleccionadoId) {
  if (asiento.id === seleccionadoId) return 'seleccionado';
  return asiento.disponible ? 'libre' : 'ocupado';
}

/** Marca del asiento para la leyenda: mismo dibujo que en el mapa. */
export function MarcaLeyenda({ estado }) {
  const clase = { libre: LIBRE, seleccionado: SELECCIONADO, ocupado: OCUPADO }[estado];

  return (
    <span aria-hidden="true" className={`relative grid size-6 shrink-0 place-items-center rounded-control border ${clase}`}>
      {estado === 'seleccionado' && <Icon name="tick" size={12} />}
      {estado === 'ocupado' && <Icon name="x" size={12} />}
    </span>
  );
}

/**
 * Mapa de asientos controlado: no pide datos ni decide qué hacer con la selección.
 * - `asientos`: [{ id, numero, categoria, disponible }] ya adaptados.
 * - `seleccionadoId` / `onSelect(asiento | null)`: un solo asiento por reserva; tocar el elegido lo quita.
 * - `focusSignal`: al cambiar (> 0), el foco va al primer asiento libre.
 * Teclado: flechas (un asiento o una fila), Inicio/Fin dentro de la fila, Re Pág/Av Pág (5 filas),
 * Enter y Espacio alternan. Un solo asiento tiene tabindex 0 (roving tabindex).
 */
export default function SeatMap({ asientos, seleccionadoId = null, onSelect, focusSignal = 0, ayudaId }) {
  const grupos = useMemo(() => agruparEnFilas(asientos), [asientos]);
  const filas = useMemo(() => grupos.flatMap((g) => g.filas), [grupos]);
  const refs = useRef(new Map());
  const [enfocadoId, setEnfocadoId] = useState(null);
  const [anuncio, setAnuncio] = useState('');

  const primerLibre = asientos.find((a) => a.disponible) ?? asientos[0] ?? null;
  const existe = (id) => asientos.some((a) => a.id === id);
  const tabbableId = [enfocadoId, seleccionadoId].find((id) => id !== null && existe(id)) ?? primerLibre?.id ?? null;

  useEffect(() => {
    if (focusSignal > 0 && primerLibre) refs.current.get(primerLibre.id)?.focus();
    // Solo reacciona a la señal: primerLibre cambia con cada recarga del mapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSignal]);

  function elegir(asiento) {
    if (!asiento.disponible) return;

    if (asiento.id === seleccionadoId) {
      onSelect(null);
      setAnuncio('Selección quitada.');
    } else {
      onSelect(asiento);
      setAnuncio(`Asiento ${asiento.numero} seleccionado. ${asiento.categoria}.`);
    }
  }

  function mover(asiento, tecla) {
    const fila = filas.findIndex((f) => f.asientos.some((a) => a.id === asiento.id));
    const columna = filas[fila].asientos.findIndex((a) => a.id === asiento.id);
    let nuevaFila = fila;
    let nuevaColumna = columna;

    if (tecla === 'ArrowRight') nuevaColumna += 1;
    if (tecla === 'ArrowLeft') nuevaColumna -= 1;
    if (tecla === 'ArrowDown') nuevaFila += 1;
    if (tecla === 'ArrowUp') nuevaFila -= 1;
    if (tecla === 'PageDown') nuevaFila += 5;
    if (tecla === 'PageUp') nuevaFila -= 5;
    if (tecla === 'Home') nuevaColumna = 0;
    if (tecla === 'End') nuevaColumna = filas[fila].asientos.length - 1;

    nuevaFila = Math.min(Math.max(nuevaFila, 0), filas.length - 1);
    const destino = filas[nuevaFila].asientos;
    const destinoAsiento = destino[Math.min(Math.max(nuevaColumna, 0), destino.length - 1)];

    refs.current.get(destinoAsiento.id)?.focus();
  }

  function alPresionar(evento, asiento) {
    if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End', 'PageUp', 'PageDown'].includes(evento.key)) {
      evento.preventDefault();
      mover(asiento, evento.key);
    }
  }

  return (
    <div role="group" aria-label="Mapa de asientos" aria-describedby={ayudaId} className="flex flex-col gap-10">
      <p role="status" className="sr-only">
        {anuncio}
      </p>

      {grupos.map((grupo) => {
        const libres = grupo.asientos.filter((a) => a.disponible).length;
        const titulo = `cabina-${grupo.codigo}`;

        return (
          <section key={grupo.codigo} aria-labelledby={titulo}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line pb-3">
              <h3 id={titulo} className="m-0 text-app-title">
                {grupo.categoria}
              </h3>
              <span className="font-mono text-app-label uppercase text-ink-faint">
                {grupo.filas.length} {grupo.filas.length === 1 ? 'fila' : 'filas'} · {grupo.asientos.length}{' '}
                {grupo.asientos.length === 1 ? 'asiento' : 'asientos'} · {libres} {libres === 1 ? 'libre' : 'libres'}
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-y-1 overflow-x-auto pb-1">
              {grupo.filas.map((fila) => {
                const mitad = grupo.porFila / 2;

                return (
                  <div key={fila.etiqueta} role="group" aria-label={`Fila ${fila.etiqueta}`} className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="w-6 shrink-0 text-right font-mono text-app-label tracking-normal text-ink-faint">
                      {fila.etiqueta}
                    </span>
                    <div className="flex gap-x-0.5">
                      {fila.asientos.map((asiento, indice) => {
                        const estado = estadoDe(asiento, seleccionadoId);
                        const clase = { libre: LIBRE, seleccionado: SELECCIONADO, ocupado: OCUPADO }[estado];

                        return (
                          <span key={asiento.id} className="flex gap-x-0.5">
                            {indice === mitad && <span aria-hidden="true" className="w-3 shrink-0" />}
                            <button
                              ref={(nodo) => {
                                if (nodo) refs.current.set(asiento.id, nodo);
                                else refs.current.delete(asiento.id);
                              }}
                              type="button"
                              tabIndex={asiento.id === tabbableId ? 0 : -1}
                              aria-pressed={asiento.disponible ? estado === 'seleccionado' : undefined}
                              aria-disabled={asiento.disponible ? undefined : 'true'}
                              aria-label={`Asiento ${asiento.numero}, ${asiento.categoria}, fila ${fila.etiqueta}, ${estado}`}
                              onClick={() => elegir(asiento)}
                              onFocus={() => setEnfocadoId(asiento.id)}
                              onKeyDown={(evento) => alPresionar(evento, asiento)}
                              className={`${ASIENTO} ${clase}`}
                            >
                              {estado === 'ocupado' ? <Icon name="x" size={12} /> : asiento.numero}
                              {estado === 'seleccionado' && <Icon name="tick" size={12} className="absolute right-1 top-1" />}
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
