import { useEffect, useMemo, useRef, useState } from 'react';
import reservasApi from '../api/reservasApi.js';
import vuelosApi from '../api/vuelosApi.js';
import AdminTabs from '../components/AdminTabs.jsx';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import FormField from '../components/FormField.jsx';
import Loading from '../components/Loading.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ReservaRow from '../components/ReservaRow.jsx';
import useAsync from '../hooks/useAsync.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatFechaHora } from '../utils/formatDate.js';

function ResumenReserva({ reserva }) {
  return (
    <div>
      <p className="m-0 font-mono text-app-data text-ink">
        {reserva.numeroVuelo}
        {reserva.vuelo ? ` · ${reserva.vuelo.origen} a ${reserva.vuelo.destino}` : ''}
      </p>
      <p className="m-0 mt-1 text-app-body-sm text-ink">
        {reserva.nombrePasajero || 'Pasajero sin nombre'} · Asiento {reserva.numeroAsiento || '—'}
      </p>
      <p className="m-0 mt-1 font-mono text-app-body-sm text-ink-muted">
        {reserva.vuelo ? formatFechaHora(reserva.vuelo.fechaSalida) : 'Fecha no disponible'} ·{' '}
        {formatCurrency(reserva.precioPagado)}
      </p>
    </div>
  );
}

export default function AdminReservasPage() {
  const reservasState = useAsync(reservasApi.listar);
  const vuelosState = useAsync(vuelosApi.listar);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroVuelo, setFiltroVuelo] = useState('');
  const [canceladas, setCanceladas] = useState(() => new Set());
  const [confirmacion, setConfirmacion] = useState(null);
  const [cancelando, setCancelando] = useState(null);
  const [errores, setErrores] = useState({});
  const [anuncio, setAnuncio] = useState('');
  const focoPendiente = useRef(null);

  const vuelosPorId = useMemo(
    () => new Map((vuelosState.data ?? []).map((vuelo) => [vuelo.id, vuelo])),
    [vuelosState.data],
  );

  const reservas = useMemo(() => {
    const lista = (reservasState.data ?? []).map((reserva) => ({
      ...reserva,
      estado: canceladas.has(reserva.id) ? 'Cancelada' : reserva.estado,
      vuelo: vuelosPorId.get(reserva.vueloId) ?? null,
    }));

    return lista.sort((a, b) => (b.fechaReserva ?? 0) - (a.fechaReserva ?? 0));
  }, [reservasState.data, canceladas, vuelosPorId]);

  const opcionesVuelo = useMemo(() => {
    const opciones = new Map((vuelosState.data ?? []).map((vuelo) => [String(vuelo.id), vuelo.numeroVuelo]));

    reservas.forEach((reserva) => {
      const clave = String(reserva.vueloId);
      if (!opciones.has(clave)) opciones.set(clave, reserva.numeroVuelo || `Vuelo ${reserva.vueloId}`);
    });

    return [...opciones.entries()].sort((a, b) => a[1].localeCompare(b[1], 'es'));
  }, [vuelosState.data, reservas]);

  const visibles = useMemo(
    () =>
      reservas.filter(
        (reserva) =>
          (!filtroEstado || reserva.estado === filtroEstado) &&
          (!filtroVuelo || String(reserva.vueloId) === filtroVuelo),
      ),
    [reservas, filtroEstado, filtroVuelo],
  );

  const hayFiltros = Boolean(filtroEstado || filtroVuelo);

  useEffect(() => {
    if (focoPendiente.current === null) return;

    document.getElementById(`reserva-${focoPendiente.current}`)?.focus();
    focoPendiente.current = null;
  }, [canceladas]);

  function limpiarFiltros() {
    setFiltroEstado('');
    setFiltroVuelo('');
  }

  function pedirCancelacion(reserva) {
    setErrores((previos) => {
      if (!(reserva.id in previos)) return previos;
      const copia = { ...previos };
      delete copia[reserva.id];
      return copia;
    });
    setConfirmacion(reserva);
  }

  async function confirmarCancelacion() {
    if (!confirmacion) return;

    const reserva = confirmacion;
    setCancelando(reserva.id);
    setErrores((previos) => {
      if (!(reserva.id in previos)) return previos;
      const copia = { ...previos };
      delete copia[reserva.id];
      return copia;
    });

    try {
      await reservasApi.cancelar(reserva.id);
      focoPendiente.current = reserva.id;
      setCanceladas((previas) => new Set(previas).add(reserva.id));
      setAnuncio(`Reserva ${reserva.numeroVuelo} cancelada.`);
      setConfirmacion(null);
    } catch (error) {
      setErrores((previos) => ({ ...previos, [reserva.id]: error }));
    } finally {
      setCancelando(null);
    }
  }

  let contenido;

  if (reservasState.error && !reservasState.data) {
    contenido = (
      <ErrorMessage
        error={reservasState.error}
        title={reservasState.error.status === 403 ? 'Acceso restringido' : 'No pudimos cargar las reservas'}
        onRetry={reservasState.error.status === 403 ? undefined : reservasState.reload}
        retrying={reservasState.retrying}
        className="mt-6"
      />
    );
  } else if (reservasState.loading && !reservasState.data) {
    contenido = <Loading rows={4} label="Cargando reservas…" className="mt-6" />;
  } else if (reservas.length === 0) {
    contenido = (
      <EmptyState title="No hay reservas registradas" className="mt-2">
        Cuando los usuarios reserven vuelos, van a aparecer en esta lista.
      </EmptyState>
    );
  } else if (visibles.length === 0) {
    contenido = (
      <EmptyState
        announce
        title="No hay reservas con esos filtros"
        className="mt-2"
        action={
          <Button variant="secondary" size="sm" onClick={limpiarFiltros}>
            Limpiar filtros
          </Button>
        }
      >
        Probá con otro estado o con otro vuelo.
      </EmptyState>
    );
  } else {
    contenido = (
      <ul className="m-0 list-none border-t border-line p-0">
        {visibles.map((reserva) => (
          <ReservaRow
            key={reserva.id}
            reserva={reserva}
            cancelando={cancelando === reserva.id}
            error={confirmacion?.id === reserva.id ? undefined : errores[reserva.id]}
            onCancel={pedirCancelacion}
          />
        ))}
      </ul>
    );
  }

  return (
    <>
      <div className="mx-auto w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] pt-10">
        <PageHeader
          breadcrumb="Administración / reservas"
          title="Reservas"
          lead="Consultá todas las reservas del sistema, filtrá por estado o vuelo y cancelá las que sean necesarias."
          actions={
            <Button
              variant="secondary"
              size="sm"
              icon="refresh"
              onClick={reservasState.reload}
              pending={reservasState.loading}
              pendingLabel="Actualizando…"
            >
              Actualizar
            </Button>
          }
        />

        <AdminTabs />

        <section aria-label="Filtros de reservas" className="mt-6 border-y border-line py-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]">
            <FormField
              label="Estado"
              control="select"
              value={filtroEstado}
              onChange={(evento) => setFiltroEstado(evento.target.value)}
            >
              <option value="">Todos los estados</option>
              <option>Confirmada</option>
              <option>Cancelada</option>
            </FormField>
            <FormField
              label="Vuelo"
              control="select"
              value={filtroVuelo}
              onChange={(evento) => setFiltroVuelo(evento.target.value)}
            >
              <option value="">Todos los vuelos</option>
              {opcionesVuelo.map(([id, codigo]) => (
                <option key={id} value={id}>
                  {codigo}
                </option>
              ))}
            </FormField>
            <div className="flex flex-col justify-end">
              <Button variant="secondary" size="sm" onClick={limpiarFiltros} disabled={!hayFiltros}>
                Limpiar filtros
              </Button>
            </div>
          </div>
        </section>

        {vuelosState.error && reservas.length > 0 && (
          <Alert
            tone="warning"
            title="No pudimos completar los datos de los vuelos"
            className="mt-6"
            action={
              <Button
                variant="secondary"
                size="sm"
                icon="refresh"
                onClick={vuelosState.reload}
                pending={vuelosState.retrying}
                pendingLabel="Reintentando…"
              >
                Reintentar
              </Button>
            }
          >
            Las reservas se muestran con los datos disponibles.
          </Alert>
        )}

        <section aria-label="Listado de reservas" className="mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <p aria-live="polite" className="m-0 font-mono text-app-label uppercase text-ink-muted">
              {reservasState.data
                ? `${reservas.length} ${reservas.length === 1 ? 'reserva' : 'reservas'} · ${visibles.length} ${visibles.length === 1 ? 'visible' : 'visibles'}`
                : 'Cargando reservas…'}
            </p>
            {reservasState.updatedAt && (
              <span className="font-mono text-app-label uppercase text-ink-faint">
                Actualizado {formatFechaHora(reservasState.updatedAt)}
              </span>
            )}
          </div>

          <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
            {anuncio}
          </p>

          {contenido}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(confirmacion)}
        title="¿Cancelar la reserva?"
        description={
          confirmacion
            ? `Se libera el asiento ${confirmacion.numeroAsiento || 'de esta reserva'}. Esta acción no se puede deshacer.`
            : ''
        }
        summary={confirmacion ? <ResumenReserva reserva={confirmacion} /> : null}
        confirmLabel="Cancelar reserva"
        pendingLabel="Cancelando…"
        pending={Boolean(confirmacion && cancelando === confirmacion.id)}
        error={confirmacion ? errores[confirmacion.id] : null}
        errorTitle={errores[confirmacion?.id]?.status === 403 ? 'Acceso restringido' : 'No se pudo cancelar la reserva'}
        onConfirm={confirmarCancelacion}
        onClose={() => setConfirmacion(null)}
      />
    </>
  );
}
