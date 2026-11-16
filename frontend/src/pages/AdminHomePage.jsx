import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import reservasApi from '../api/reservasApi.js';
import vuelosApi from '../api/vuelosApi.js';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Icon from '../components/Icon.jsx';
import Loading from '../components/Loading.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusIndicator from '../components/StatusIndicator.jsx';
import TextLink from '../components/TextLink.jsx';
import VueloForm from '../components/VueloForm.jsx';
import useAsync from '../hooks/useAsync.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatFechaHora } from '../utils/formatDate.js';

const ACCION =
  'inline-flex min-h-(--size-touch) items-center border-b border-line-strong pb-0.5 font-sans text-app-body-sm font-medium transition-colors duration-(--duration-state) disabled:cursor-not-allowed disabled:border-line disabled:text-ink-faint';

/** Lista de pasajeros del vuelo (manifiesto): sale de GET /api/reservas, que al Administrador le devuelve todas. */
function Pasajeros({ vuelo, reservas, estado }) {
  if (estado.error) {
    return <ErrorMessage error={estado.error} title="No pudimos cargar los pasajeros" onRetry={estado.reload} retrying={estado.retrying} />;
  }
  if (estado.loading && !estado.data) return <Loading rows={2} label="Cargando pasajeros…" />;
  if (reservas.length === 0) {
    return <p className="m-0 text-app-body-sm text-ink-muted">Este vuelo todavía no tiene reservas.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Pasajeros del vuelo {vuelo.numeroVuelo}</caption>
        <thead>
          <tr className="font-mono text-app-label uppercase text-ink-faint">
            <th scope="col" className="py-2 pr-4 font-normal">Asiento</th>
            <th scope="col" className="py-2 pr-4 font-normal">Pasajero</th>
            <th scope="col" className="py-2 pr-4 font-normal">Documento</th>
            <th scope="col" className="py-2 pr-4 font-normal">Reservó</th>
            <th scope="col" className="py-2 font-normal">Estado</th>
          </tr>
        </thead>
        <tbody>
          {reservas.map((reserva) => (
            <tr key={reserva.id} className="border-t border-line text-app-body-sm">
              <td className="py-2 pr-4 font-mono">
                {reserva.numeroAsiento}
                {reserva.categoriaAsiento === 'Ejecutivo' && <span className="ml-1.5 text-app-label text-ink-faint">EJ</span>}
              </td>
              <td className="py-2 pr-4">{reserva.nombrePasajero || '—'}</td>
              <td className="py-2 pr-4 font-mono">{reserva.documentoPasajero || '—'}</td>
              <td className="py-2 pr-4 text-ink-muted">{reserva.usuarioNombre || '—'}</td>
              <td className="py-2">
                <StatusIndicator estado={reserva.estado} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FilaVuelo({ vuelo, reservas, reservasEstado, onEditar, onEliminar }) {
  const [verPasajeros, setVerPasajeros] = useState(false);
  const confirmadas = reservas.filter((reserva) => reserva.estado === 'Confirmada').length;

  return (
    <li className="border-b border-line transition-colors duration-(--duration-state) hover:bg-surface-tint">
      <div className="grid gap-x-5 gap-y-3 px-1 py-4 tbl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] tbl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-app-data text-ink">{vuelo.numeroVuelo}</span>
            <StatusIndicator estado={vuelo.estado} />
          </div>
          <p className="m-0 mt-1.5 inline-flex flex-wrap items-center gap-1.5 font-semibold tracking-[-0.01em]">
            <span className="break-words">{vuelo.origen}</span>
            <span className="sr-only"> a </span>
            <Icon name="plane" size={12} className="text-accent" />
            <span className="break-words">{vuelo.destino}</span>
          </p>
        </div>

        <div className="font-mono text-app-body-sm text-ink">
          <p className="m-0">
            <span className="text-app-label uppercase text-ink-faint">Salida </span>
            {vuelo.fechaSalida ? (
              <time dateTime={vuelo.fechaSalida.toISOString()}>{formatFechaHora(vuelo.fechaSalida)}</time>
            ) : (
              '—'
            )}
          </p>
          <p className="m-0 mt-1">
            <span className="text-app-label uppercase text-ink-faint">Libres </span>
            {vuelo.asientosDisponibles} de {vuelo.capacidad}
            <span className="mx-2 text-line-strong">·</span>
            <span className="text-app-label uppercase text-ink-faint">Precio </span>
            {formatCurrency(vuelo.precioBase)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 tbl:justify-end">
          <TextLink as={Link} to={`/dashboard/vuelos/${vuelo.id}`} size="sm">
            Ver
          </TextLink>
          <button
            type="button"
            onClick={() => setVerPasajeros((abierto) => !abierto)}
            aria-expanded={verPasajeros}
            aria-controls={`pasajeros-${vuelo.id}`}
            className={`${ACCION} text-ink hover:border-ink`}
          >
            Pasajeros{reservasEstado.data ? ` (${confirmadas})` : ''}
          </button>
          <button
            type="button"
            onClick={() => onEditar(vuelo)}
            aria-label={`Editar vuelo ${vuelo.numeroVuelo}`}
            className={`${ACCION} text-ink hover:border-ink`}
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => onEliminar(vuelo)}
            aria-label={`Eliminar vuelo ${vuelo.numeroVuelo}`}
            className={`${ACCION} text-danger hover:border-danger`}
          >
            Eliminar
          </button>
        </div>
      </div>

      {verPasajeros && (
        <div id={`pasajeros-${vuelo.id}`} className="px-1 pb-5">
          <Pasajeros vuelo={vuelo} reservas={reservas} estado={reservasEstado} />
        </div>
      )}
    </li>
  );
}

const SIN_RESERVAS = [];

// Confirmadas primero y, dentro de cada estado, por número de asiento.
function ordenarManifiesto(a, b) {
  if (a.estado !== b.estado) return a.estado === 'Confirmada' ? -1 : 1;
  return String(a.numeroAsiento).localeCompare(String(b.numeroAsiento), 'es', { numeric: true });
}

/**
 * Panel de administración: CRUD de vuelos contra /api/vuelos (solo Administrador).
 * AdminRoute oculta la pantalla; la seguridad real son los [Authorize(Roles = "Administrador")] del backend.
 */
export default function AdminHomePage() {
  const { data: vuelos, error, loading, retrying, reload: recargarVuelos } = useAsync(vuelosApi.listar);
  const reservasEstado = useAsync(reservasApi.listar);
  const recargarReservas = reservasEstado.reload;
  const [formulario, setFormulario] = useState(null);
  const [aviso, setAviso] = useState('');
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState(null);
  const formularioRef = useRef(null);

  const ordenados = useMemo(
    () =>
      [...(vuelos ?? [])].sort(
        (a, b) => (a.fechaSalida?.getTime() ?? Infinity) - (b.fechaSalida?.getTime() ?? Infinity),
      ),
    [vuelos],
  );

  const reservasPorVuelo = useMemo(() => {
    const mapa = new Map();
    for (const reserva of reservasEstado.data ?? []) {
      if (!mapa.has(reserva.vueloId)) mapa.set(reserva.vueloId, []);
      mapa.get(reserva.vueloId).push(reserva);
    }
    for (const lista of mapa.values()) lista.sort(ordenarManifiesto);
    return mapa;
  }, [reservasEstado.data]);

  // Al crear, editar (por ejemplo cancelar un vuelo cancela sus reservas) o eliminar,
  // se recargan vuelos y reservas.
  const reload = useCallback(() => {
    recargarVuelos();
    recargarReservas();
  }, [recargarVuelos, recargarReservas]);

  useEffect(() => {
    if (formulario) formularioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [formulario]);

  function abrirFormulario(vuelo = null) {
    setAviso('');
    setFormulario({ vuelo });
  }

  async function guardar(dto) {
    const editando = formulario?.vuelo;
    const guardado = editando ? await vuelosApi.actualizar(editando.id, dto) : await vuelosApi.crear(dto);

    setFormulario(null);
    setAviso(`Vuelo ${guardado.numeroVuelo} ${editando ? 'actualizado' : 'creado'} correctamente.`);
    reload();
  }

  function pedirEliminacion(vuelo) {
    setErrorEliminar(null);
    setAEliminar(vuelo);
  }

  async function confirmarEliminacion() {
    if (!aEliminar) return;

    setEliminando(true);
    setErrorEliminar(null);

    try {
      await vuelosApi.eliminar(aEliminar.id);
      setAviso(`Vuelo ${aEliminar.numeroVuelo} eliminado.`);
      if (formulario?.vuelo?.id === aEliminar.id) setFormulario(null);
      setAEliminar(null);
      reload();
    } catch (falla) {
      setErrorEliminar(falla);
    } finally {
      setEliminando(false);
    }
  }

  let contenido;
  if (error && !vuelos) {
    contenido = (
      <ErrorMessage error={error} title="No pudimos cargar los vuelos" onRetry={reload} retrying={retrying} className="mt-6" />
    );
  } else if (loading && !vuelos) {
    contenido = <Loading rows={4} label="Cargando vuelos…" className="mt-6" />;
  } else if (ordenados.length === 0) {
    contenido = (
      <EmptyState
        title="No hay vuelos cargados"
        className="mt-2"
        action={
          <Button size="sm" onClick={() => abrirFormulario()}>
            Crear el primer vuelo
          </Button>
        }
      >
        Creá un vuelo para que los usuarios puedan reservar asientos.
      </EmptyState>
    );
  } else {
    contenido = (
      <ul className="m-0 list-none border-t border-line p-0">
        {ordenados.map((vuelo) => (
          <FilaVuelo
            key={vuelo.id}
            vuelo={vuelo}
            reservas={reservasPorVuelo.get(vuelo.id) ?? SIN_RESERVAS}
            reservasEstado={reservasEstado}
            onEditar={abrirFormulario}
            onEliminar={pedirEliminacion}
          />
        ))}
      </ul>
    );
  }

  return (
    <>
      <div className="mx-auto w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] pt-10">
        <PageHeader
          breadcrumb="Tablero / administración"
          title="Administración"
          lead="Creá, editá y eliminá vuelos. Las reservas de todos los usuarios se consultan desde Mis reservas."
          actions={
            <>
              <Button
                variant="secondary"
                size="sm"
                icon="refresh"
                onClick={reload}
                pending={loading}
                pendingLabel="Actualizando…"
              >
                Actualizar
              </Button>
              <Button size="sm" onClick={() => abrirFormulario()} disabled={Boolean(formulario && !formulario.vuelo)}>
                Nuevo vuelo
              </Button>
            </>
          }
        />

        {aviso && (
          <Alert tone="success" title={aviso} className="mt-6">
            El listado ya muestra los datos actualizados.
          </Alert>
        )}

        <div ref={formularioRef} className="scroll-mt-28">
          {formulario && (
            <VueloForm
              key={formulario.vuelo?.id ?? 'nuevo'}
              vuelo={formulario.vuelo}
              onGuardar={guardar}
              onCancelar={() => setFormulario(null)}
            />
          )}
        </div>

        <section aria-labelledby="vuelos-admin" className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4 pb-4">
            <div>
              <h2 id="vuelos-admin" className="m-0 text-app-section">
                Vuelos
              </h2>
              <p aria-live="polite" className="m-0 mt-1 font-mono text-app-label uppercase text-ink-muted">
                {vuelos ? `${vuelos.length} ${vuelos.length === 1 ? 'vuelo' : 'vuelos'}` : 'Cargando…'}
              </p>
            </div>
            <TextLink as={Link} to="/dashboard/reservas" size="sm">
              Ver todas las reservas
            </TextLink>
          </div>
          {contenido}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(aEliminar)}
        title="¿Eliminar el vuelo?"
        description={
          aEliminar
            ? `Se eliminan el vuelo ${aEliminar.numeroVuelo} y sus asientos. Si tiene reservas (aunque estén canceladas) no se puede eliminar.`
            : ''
        }
        confirmLabel="Eliminar vuelo"
        pendingLabel="Eliminando…"
        pending={eliminando}
        error={errorEliminar}
        errorTitle="No se pudo eliminar el vuelo"
        onConfirm={confirmarEliminacion}
        onClose={() => setAEliminar(null)}
      />
    </>
  );
}
