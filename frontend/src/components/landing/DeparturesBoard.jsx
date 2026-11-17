import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { formatDiaMes, formatFecha, formatHora } from '../../utils/formatDate.js';
import { esHoy, primeroOperativo, proximasLlegadas, proximasSalidas } from '../../utils/vuelos.js';
import EmptyState from '../EmptyState.jsx';
import ErrorMessage from '../ErrorMessage.jsx';
import Icon from '../Icon.jsx';
import Loading from '../Loading.jsx';
import TextLink from '../TextLink.jsx';
import SampleStatus from './SampleStatus.jsx';

const VISTAS = [
  { id: 'salidas', label: 'Salidas', campo: 'fechaSalida', vacio: 'No hay salidas próximas' },
  { id: 'llegadas', label: 'Llegadas', campo: 'fechaLlegada', vacio: 'No hay llegadas próximas' },
];

const MAX_FILAS = 4;
const COLUMNAS_ESCRITORIO = 'tbl:grid-cols-[104px_minmax(0,1fr)_82px_72px_106px] tbl:gap-4';
const COLUMNAS = `grid-cols-[74px_minmax(0,1fr)_58px] gap-x-2.5 gap-y-[5px] max-[420px]:grid-cols-[66px_minmax(0,1fr)_52px] max-[420px]:gap-x-[7px] max-[360px]:grid-cols-[62px_minmax(0,1fr)_48px] ${COLUMNAS_ESCRITORIO}`;
const LABEL_INK = 'font-mono text-app-label uppercase text-ink-inverse-muted';

function Fila({ vuelo, campo, ahora, activa, indice }) {
  const fecha = vuelo[campo];

  return (
    <li
      style={{ animationDelay: `calc(var(--stagger-row) * ${indice})` }}
      className={`flight-row-hover grid min-h-16 animate-row-in items-center border-b border-line-inverse py-3.5 tbl:min-h-[68px] tbl:py-4 ${COLUMNAS}`}
    >
      <span className="mt-0.5 self-start whitespace-nowrap font-mono text-app-data text-ink-inverse max-[360px]:text-xs tbl:mt-0 tbl:self-center">
        {activa && <span aria-hidden="true" className="mr-2 inline-block size-[5px] bg-accent align-[2px]" />}
        {vuelo.numeroVuelo}
      </span>

      <span className="min-w-0">
          <span className="flex items-center gap-[7px] text-[15px] font-semibold tracking-[-0.01em] max-[420px]:text-sm max-[360px]:text-[13px]">
          <span className="min-w-0 break-words">{vuelo.origen}</span>
          <span className="sr-only"> a </span>
          <Icon name="plane" size={12} className={activa ? 'text-accent' : 'text-ink-inverse-muted'} />
          <span className="min-w-0 break-words">{vuelo.destino}</span>
        </span>
          {vuelo.origenCiudad && (
            <span className="mt-1 block text-app-label text-ink-inverse-muted">{vuelo.origenCiudad} a {vuelo.destinoCiudad}</span>
          )}
      </span>

      <span className="self-start text-right font-mono tbl:self-center tbl:text-left">
        <time dateTime={fecha.toISOString()} className="block text-lg tracking-[-0.04em] text-ink-inverse max-[420px]:text-[17px] max-[360px]:text-base tbl:text-xl">
          {formatHora(fecha)}
        </time>
        {!esHoy(fecha, ahora) && (
          <span className="block text-app-label uppercase text-ink-inverse-muted">{formatFecha(fecha).slice(0, -5)}</span>
        )}
      </span>

      <span className="hidden font-mono text-app-data text-surface-band tbl:block">{vuelo.asientosDisponibles}</span>

      <span className="col-span-3 tbl:col-span-1">
        <SampleStatus estado={vuelo.estado} tone="ink" />
      </span>
    </li>
  );
}

/**
 * Muestra de salidas y llegadas sobre banda ink, con pestañas (flechas, Inicio y Fin).
 * Es la única sección de la landing que muestra error propio: cargando, error con "Reintentar",
 * vacío y datos. Con `#tablero` (o un clic en un enlace a esa ancla) resalta el tablero un instante.
 */
export default function DeparturesBoard({ vuelos, ahora, actualizado, loading, error, retrying, onRetry }) {
  const [vistaId, setVistaId] = useState('salidas');
  const [resaltado, setResaltado] = useState(false);
  const temporizador = useRef(null);
  const base = useId();
  const vista = VISTAS.find((item) => item.id === vistaId);
  const tabRefs = useRef({});

  const lista = useMemo(() => {
    if (!vuelos) return [];
    const vuelosDeLaVista = vuelos.filter((vuelo) => vuelo.tipo === vista.id);
    return vista.id === 'salidas' ? proximasSalidas(vuelosDeLaVista, ahora) : proximasLlegadas(vuelosDeLaVista, ahora);
  }, [vuelos, ahora, vista.id]);

  const filas = lista.slice(0, MAX_FILAS);
  const proximo = primeroOperativo(vista.id === 'salidas' ? lista.filter((vuelo) => vuelo.estado !== 'En vuelo') : lista);
  useEffect(() => {
    function resaltar() {
      setResaltado(true);
      window.clearTimeout(temporizador.current);
      temporizador.current = window.setTimeout(() => setResaltado(false), 1600);
    }

    function alHacerClic(evento) {
      if (evento.target.closest?.('a[href$="#tablero"]')) resaltar();
    }

    document.addEventListener('click', alHacerClic);
    return () => {
      document.removeEventListener('click', alHacerClic);
      window.clearTimeout(temporizador.current);
    };
  }, []);

  function alPulsarTecla(evento, indice) {
    const ultimo = VISTAS.length - 1;
    const destino = {
      ArrowRight: indice === ultimo ? 0 : indice + 1,
      ArrowLeft: indice === 0 ? ultimo : indice - 1,
      Home: 0,
      End: ultimo,
    }[evento.key];

    if (destino === undefined) return;

    evento.preventDefault();
    setVistaId(VISTAS[destino].id);
    tabRefs.current[VISTAS[destino].id]?.focus();
  }

  const tabId = (id) => `${base}-tab-${id}`;
  const panelId = `${base}-panel`;

  return (
    <section id="tablero" data-surface="ink" aria-labelledby="tablero-titulo" className="bg-surface-ink py-[clamp(72px,9vw,120px)] text-ink-inverse max-sm:py-16">
      <div className="mx-auto grid w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] items-start gap-11 min-[1000px]:grid-cols-[minmax(0,0.66fr)_minmax(0,1.34fr)] min-[1000px]:gap-[clamp(48px,7vw,96px)]">
        <div className="min-w-0">
          <h2 id="tablero-titulo" className="m-0 max-w-[12ch] text-[clamp(2.2rem,4vw,3rem)] font-semibold leading-[0.94] tracking-[-0.04em]">
            Vuelos en operación
          </h2>
          <p className="m-0 mt-4 max-w-[36ch] text-[14.5px] leading-[1.6] text-ink-inverse-strong">
            Consultá las próximas salidas y llegadas, con sus horarios, disponibilidad y estado.
          </p>
          {ahora && (
            <p className="m-0 mt-3 font-mono text-app-label uppercase tracking-[0.08em] text-surface-band/80">
              Hoy, {formatDiaMes(ahora)}
            </p>
          )}

        </div>

        <div className={`min-w-0 ${resaltado ? 'outline-2 outline-offset-[12px] outline-accent' : ''}`}>
          <div className="flex items-end justify-between gap-3 border-b border-line-inverse-strong sm:gap-5">
            <div role="tablist" aria-label="Ver salidas o llegadas" className="flex gap-5 sm:gap-[26px]">
              {VISTAS.map((item, indice) => {
                const activa = item.id === vistaId;

                return (
                  <button
                    key={item.id}
                    ref={(nodo) => {
                      tabRefs.current[item.id] = nodo;
                    }}
                    id={tabId(item.id)}
                    type="button"
                    role="tab"
                    aria-selected={activa}
                    aria-controls={panelId}
                    tabIndex={activa ? 0 : -1}
                    onClick={() => setVistaId(item.id)}
                    onKeyDown={(evento) => alPulsarTecla(evento, indice)}
                    className={`-mb-px min-h-(--size-touch) cursor-pointer appearance-none border-0 border-b-2 bg-transparent px-0 pb-3 font-sans text-[13px] font-medium transition-colors duration-(--duration-state) hover:text-ink-inverse sm:text-app-body-sm ${activa ? 'border-accent text-ink-inverse' : 'border-transparent text-ink-inverse-muted'}`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            {actualizado && (
              <span className="flex items-center gap-[7px] pb-3.5 font-mono text-app-label text-ink-inverse-strong">
                <span aria-hidden="true" className="size-(--size-status-dot-sm) rounded-full bg-accent" />
                <time dateTime={actualizado.toISOString()}>{formatHora(actualizado)}</time>
              </span>
            )}
          </div>

          <div id={panelId} role="tabpanel" aria-labelledby={tabId(vistaId)}>
            {error && !vuelos ? (
              <ErrorMessage surface="ink" error={error} onRetry={onRetry} retrying={retrying} className="mt-6" />
            ) : loading && !vuelos ? (
              <Loading surface="ink" rows={MAX_FILAS} label="Cargando vuelos…" className="pt-6" />
            ) : filas.length === 0 ? (
              <EmptyState surface="ink" title={vista.vacio} className="border-t-0 pt-8">
                Cuando haya vuelos programados van a aparecer acá.
              </EmptyState>
            ) : (
              <>
                <div aria-hidden="true" className={`hidden pb-2.5 pt-[18px] tbl:grid ${COLUMNAS_ESCRITORIO} ${LABEL_INK}`}>
                  <span>Vuelo</span>
                  <span>Ruta</span>
                  <span>Hora</span>
                  <span>Asientos</span>
                  <span>Estado</span>
                </div>
                <ol key={vista.id} className="m-0 list-none border-t border-line-inverse p-0">
                  {filas.map((vuelo, indice) => (
                    <Fila
                      key={vuelo.id}
                      vuelo={vuelo}
                      campo={vista.campo}
                      ahora={ahora}
                      activa={vuelo === proximo}
                      indice={indice}
                    />
                  ))}
                </ol>
              </>
            )}
          </div>

          {vuelos && filas.length > 0 && (
            <div className="mt-[18px] flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-line-inverse pt-4 text-app-label text-ink-inverse-muted max-tbl:items-start">
              <span aria-live="polite" className="font-mono">
                {filas.length} de {lista.length} {lista.length === 1 ? 'vuelo próximo' : 'vuelos próximos'}
              </span>
              <TextLink href="#operacion" tone="ink" size="sm">
                Ver detalle de vuelo
              </TextLink>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
