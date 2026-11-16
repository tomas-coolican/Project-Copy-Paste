import { useMemo, useState } from 'react';
import vuelosApi from '../api/vuelosApi.js';
import Button from '../components/Button.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import FormField from '../components/FormField.jsx';
import Loading from '../components/Loading.jsx';
import PageHeader from '../components/PageHeader.jsx';
import VueloRow from '../components/VueloRow.jsx';
import useAsync from '../hooks/useAsync.js';
import { formatHora } from '../utils/formatDate.js';

const FILTROS_INICIALES = {
  texto: '',
  estado: '',
  fecha: '',
  soloDisponibles: false,
  orden: 'proxima',
};

function claveDia(fecha) {
  if (!fecha) return '';
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function tieneFiltros(filtros) {
  return Boolean(
    filtros.texto || filtros.estado || filtros.fecha || filtros.soloDisponibles || filtros.orden !== 'proxima',
  );
}

export default function VuelosPage() {
  const { data: vuelos, error, loading, retrying, updatedAt, reload } = useAsync(vuelosApi.listar);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const ahora = useMemo(() => updatedAt ?? new Date(), [updatedAt]);

  function cambiar(campo, valor) {
    setFiltros((previos) => ({ ...previos, [campo]: valor }));
  }

  const filtrados = useMemo(() => {
    if (!vuelos) return [];

    const texto = filtros.texto.trim().toLowerCase();
    let lista = vuelos;

    if (texto) {
      lista = lista.filter((vuelo) =>
        [vuelo.numeroVuelo, vuelo.origen, vuelo.destino].some((valor) =>
          String(valor ?? '').toLowerCase().includes(texto),
        ),
      );
    }
    if (filtros.estado) lista = lista.filter((vuelo) => vuelo.estado === filtros.estado);
    if (filtros.fecha) lista = lista.filter((vuelo) => claveDia(vuelo.fechaSalida) === filtros.fecha);
    if (filtros.soloDisponibles) lista = lista.filter((vuelo) => vuelo.asientosDisponibles > 0);

    const direccion = filtros.orden === 'lejana' ? -1 : 1;
    return [...lista].sort(
      (a, b) => ((a.fechaSalida?.getTime() ?? Infinity) - (b.fechaSalida?.getTime() ?? Infinity)) * direccion,
    );
  }, [vuelos, filtros]);

  const hayFiltros = tieneFiltros(filtros);
  const limpiar = () => setFiltros(FILTROS_INICIALES);

  let contenido;
  if (error && !vuelos) {
    contenido = (
      <ErrorMessage
        surface="ink"
        error={error}
        title="No pudimos cargar los vuelos"
        onRetry={reload}
        retrying={retrying}
        className="mt-6"
      />
    );
  } else if (loading && !vuelos) {
    contenido = <Loading surface="ink" label="Cargando vuelos…" className="mt-6" />;
  } else if (vuelos?.length === 0) {
    contenido = (
      <EmptyState
        surface="ink"
        title="No hay vuelos cargados"
        className="mt-6 border-t-0 pt-6"
        action={
          <Button variant="secondary" size="sm" icon="refresh" onClick={reload}>
            Actualizar
          </Button>
        }
      >
        Cuando el sistema tenga vuelos, van a aparecer en este tablero.
      </EmptyState>
    );
  } else if (filtrados.length === 0) {
    contenido = (
      <EmptyState
        surface="ink"
        announce
        title="No hay vuelos con esos filtros"
        className="mt-6 border-t-0 pt-6"
        action={
          <Button variant="secondary" size="sm" onClick={limpiar}>
            Limpiar filtros
          </Button>
        }
      >
        Probá otra ruta, otro estado o una fecha distinta.
      </EmptyState>
    );
  } else {
    contenido = (
      <>
        <div
          aria-hidden="true"
          className="hidden grid-cols-[96px_minmax(0,1fr)_84px_80px_130px_16px] gap-4 pb-2.5 pt-4 font-mono text-app-label uppercase text-ink-inverse-muted tbl:grid"
        >
          <span>Vuelo</span>
          <span>Ruta</span>
          <span>Salida</span>
          <span>Asientos</span>
          <span>Estado</span>
        </div>
        <ol className="m-0 list-none p-0">
          {filtrados.map((vuelo) => (
            <VueloRow key={vuelo.id} vuelo={vuelo} ahora={ahora} />
          ))}
        </ol>
      </>
    );
  }

  return (
    <>
      <div className="mx-auto w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] pt-10">
        <PageHeader
          breadcrumb="Tablero / vuelos"
          title="Vuelos"
          lead="Consultá todas las salidas, filtrá por ruta, estado o fecha y abrí el detalle de cada vuelo."
          actions={
            <Button variant="secondary" size="sm" icon="refresh" onClick={reload} pending={loading} pendingLabel="Actualizando…">
              Actualizar
            </Button>
          }
        />

        <section aria-label="Filtros de vuelos" className="mt-6 border-y border-line py-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <FormField
              label="Buscar"
              type="search"
              value={filtros.texto}
              onChange={(evento) => cambiar('texto', evento.target.value)}
              placeholder="Origen, destino o número"
            />
            <FormField
              label="Estado"
              control="select"
              value={filtros.estado}
              onChange={(evento) => cambiar('estado', evento.target.value)}
            >
              <option value="">Todos los estados</option>
              <option>Programado</option>
              <option>En vuelo</option>
              <option>Finalizado</option>
              <option>Cancelado</option>
            </FormField>
            <FormField
              label="Fecha de salida"
              type="date"
              lang="es-AR"
              value={filtros.fecha}
              onChange={(evento) => cambiar('fecha', evento.target.value)}
            />
            <FormField
              label="Orden"
              control="select"
              value={filtros.orden}
              onChange={(evento) => cambiar('orden', evento.target.value)}
            >
              <option value="proxima">Más temprana</option>
              <option value="lejana">Más tardía</option>
            </FormField>
            <div className="flex flex-col justify-end gap-2">
              <label className="flex min-h-(--size-control) items-center gap-2.5 text-app-body-sm text-ink">
                <input
                  type="checkbox"
                  checked={filtros.soloDisponibles}
                  onChange={(evento) => cambiar('soloDisponibles', evento.target.checked)}
                  className="size-5 accent-accent"
                />
                Solo con asientos
              </label>
              <Button variant="secondary" size="sm" onClick={limpiar} disabled={!hayFiltros}>
                Limpiar filtros
              </Button>
            </div>
          </div>
        </section>
      </div>

      <section data-surface="ink" aria-label="Listado de vuelos" className="mt-8 bg-surface-ink text-ink-inverse">
        <div className="mx-auto w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] py-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <p aria-live="polite" className="m-0 font-mono text-app-label uppercase text-ink-inverse-muted">
              {vuelos
                ? `${vuelos.length} ${vuelos.length === 1 ? 'vuelo' : 'vuelos'} · ${filtrados.length} visibles`
                : error
                  ? 'Sin datos de vuelos'
                  : 'Cargando vuelos…'}
            </p>
            {updatedAt && (
              <span className="font-mono text-app-label uppercase text-ink-inverse-strong">
                Actualizado {formatHora(updatedAt)}
              </span>
            )}
          </div>

          {contenido}

          {vuelos && filtrados.length > 0 && (
            <p className="m-0 mt-4 border-t border-line-inverse pt-4 font-mono text-app-label uppercase text-ink-inverse-muted">
              Mostrando {filtrados.length} de {vuelos.length} · ordenadas por salida
            </p>
          )}
        </div>
      </section>
    </>
  );
}
