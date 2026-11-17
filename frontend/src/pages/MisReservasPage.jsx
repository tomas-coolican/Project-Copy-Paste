import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import reservasApi from '../api/reservasApi.js';
import vuelosApi from '../api/vuelosApi.js';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loading from '../components/Loading.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ReservaRow from '../components/ReservaRow.jsx';
import TextLink from '../components/TextLink.jsx';
import useAsync from '../hooks/useAsync.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatFechaHora } from '../utils/formatDate.js';

const FILTROS = [
  { id: 'todas', label: 'Todas' },
  { id: 'confirmadas', label: 'Confirmadas', estado: 'Confirmada' },
  { id: 'canceladas', label: 'Canceladas', estado: 'Cancelada' },
];

function ResumenReserva({ reserva }) {
  const salida = reserva.vuelo?.fechaSalida;

  return (
    <div>
      <p className="m-0 font-mono text-app-data text-ink">
        {reserva.numeroVuelo}
        {reserva.vuelo ? ` · ${reserva.vuelo.origen} a ${reserva.vuelo.destino}` : ''}
      </p>
      <p className="m-0 mt-1 font-mono text-app-body-sm text-ink-muted">
        Asiento {reserva.numeroAsiento || '—'} · {salida ? formatFechaHora(salida) : 'Fecha no disponible'} ·{' '}
        {formatCurrency(reserva.precioPagado)}
      </p>
    </div>
  );
}

export default function MisReservasPage() {
  const reservasState = useAsync(reservasApi.listar);
  const vuelosState = useAsync(vuelosApi.listar);
  const [filtro, setFiltro] = useState('todas');
  const [canceladas, setCanceladas] = useState(() => new Set());
  const [confirmacion, setConfirmacion] = useState(null);
  const [cancelando, setCancelando] = useState(null);
  const [errores, setErrores] = useState({});
  const [anuncio, setAnuncio] = useState('');
  const tabRefs = useRef([]);
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

  const conteos = useMemo(
    () => ({
      todas: reservas.length,
      confirmadas: reservas.filter((reserva) => reserva.estado === 'Confirmada').length,
      canceladas: reservas.filter((reserva) => reserva.estado === 'Cancelada').length,
    }),
    [reservas],
  );

  const filtroActivo = FILTROS.find((item) => item.id === filtro) ?? FILTROS[0];
  const visibles = filtroActivo.estado ? reservas.filter((reserva) => reserva.estado === filtroActivo.estado) : reservas;

  useEffect(() => {
    if (focoPendiente.current === null) return;

    document.getElementById(`reserva-${focoPendiente.current}`)?.focus();
    focoPendiente.current = null;
  }, [canceladas]);

  function seleccionarFiltro(index) {
    setFiltro(FILTROS[index].id);
    tabRefs.current[index]?.focus();
  }

  function manejarTeclado(evento, index) {
    const siguiente = {
      ArrowRight: (index + 1) % FILTROS.length,
      ArrowLeft: (index - 1 + FILTROS.length) % FILTROS.length,
      Home: 0,
      End: FILTROS.length - 1,
    }[evento.key];

    if (siguiente === undefined) return;

    evento.preventDefault();
    seleccionarFiltro(siguiente);
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
      setFiltro('todas');
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
        title="No pudimos cargar tus reservas"
        onRetry={reservasState.reload}
        retrying={reservasState.retrying}
        className="mt-6"
      />
    );
  } else if (reservasState.loading && !reservasState.data) {
    contenido = <Loading rows={4} label="Cargando reservas…" className="mt-6" />;
  } else if (reservas.length === 0) {
    contenido = (
      <EmptyState
        title="Todavía no tenés reservas"
        className="mt-2"
        action={
          <TextLink as={Link} to="/dashboard/vuelos" size="sm">
            Ver vuelos disponibles
          </TextLink>
        }
      >
        Cuando reserves un vuelo, va a aparecer en esta lista.
      </EmptyState>
    );
  } else if (visibles.length === 0) {
    contenido = (
      <EmptyState
        announce
        title={filtro === 'confirmadas' ? 'No hay reservas confirmadas' : 'No hay reservas canceladas'}
        className="mt-2"
        action={
          <Button variant="secondary" size="sm" onClick={() => seleccionarFiltro(0)}>
            Ver todas
          </Button>
        }
      >
        Probá con otra pestaña para ver el resto de tus reservas.
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
          breadcrumb="Tablero / reservas"
          title="Mis reservas"
          lead="Consultá tus reservas, mirá el pase de abordar de cada una y cancelá las que ya no necesites."
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

        <div role="tablist" aria-label="Filtrar reservas" className="mt-6 flex gap-6 border-b border-line">
          {FILTROS.map((item, index) => {
            const activa = item.id === filtro;

            return (
              <button
                key={item.id}
                ref={(nodo) => {
                  tabRefs.current[index] = nodo;
                }}
                type="button"
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={activa}
                aria-controls="panel-reservas"
                tabIndex={activa ? 0 : -1}
                onClick={() => setFiltro(item.id)}
                onKeyDown={(evento) => manejarTeclado(evento, index)}
                className={`-mb-px inline-flex min-h-(--size-touch) items-center gap-2 border-b-2 px-0 pb-3 pt-1 font-sans text-app-body-sm font-medium transition-colors duration-(--duration-state) ${
                  activa
                    ? 'border-accent text-ink'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                {item.label}
                {reservasState.data && (
                  <span className="font-mono text-app-label text-ink-faint">{conteos[item.id]}</span>
                )}
              </button>
            );
          })}
        </div>

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

        <section id="panel-reservas" role="tabpanel" aria-labelledby={`tab-${filtro}`} className="mt-6">
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
        onConfirm={confirmarCancelacion}
        onClose={() => setConfirmacion(null)}
      />
    </>
  );
}
