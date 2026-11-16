import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import reservasApi from '../api/reservasApi.js';
import vuelosApi from '../api/vuelosApi.js';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loading from '../components/Loading.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusIndicator from '../components/StatusIndicator.jsx';
import TextLink from '../components/TextLink.jsx';
import VueloRow from '../components/VueloRow.jsx';
import useAsync from '../hooks/useAsync.js';
import useAuth from '../hooks/useAuth.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatFechaLarga, formatFechaHora } from '../utils/formatDate.js';
import { proximasSalidas } from '../utils/vuelos.js';

const CANTIDAD_VUELOS = 5;

function formatearEntero(valor) {
  return valor === null ? '—' : new Intl.NumberFormat('es-AR').format(valor);
}

function contarConPalabra(cantidad, singular, plural) {
  if (cantidad === null) return '—';
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

function Metrica({ label, nota, children }) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-line py-4 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-r-0 lg:border-b-0">
      <dt className="font-mono text-app-label uppercase text-ink-muted">{label}</dt>
      <dd className="m-0 font-mono text-[1.9rem] font-medium leading-none tracking-[-0.04em]">{children}</dd>
      {nota && <dd className="m-0 font-mono text-app-label text-ink-muted">{nota}</dd>}
    </div>
  );
}

function ResumenOperativo({ vuelos, reservas, error, retrying, onRetry }) {
  const porEstado = useMemo(() => {
    const contar = (estado) => (vuelos ? vuelos.filter((vuelo) => vuelo.estado === estado).length : null);

    return {
      programados: contar('Programado'),
      enVuelo: contar('En vuelo'),
      cancelados: contar('Cancelado'),
      finalizados: contar('Finalizado'),
    };
  }, [vuelos]);

  const reservasConfirmadas = reservas ? reservas.filter((reserva) => reserva.estado === 'Confirmada').length : null;
  const reservasCanceladas = reservas ? reservas.filter((reserva) => reserva.estado === 'Cancelada').length : null;

  const ocupacion = useMemo(() => {
    if (!vuelos || vuelos.length === 0) return null;

    const capacidad = vuelos.reduce((total, vuelo) => total + (vuelo.capacidad ?? 0), 0);
    if (capacidad === 0) return null;

    const ocupados = vuelos.reduce(
      (total, vuelo) => total + Math.max((vuelo.capacidad ?? 0) - (vuelo.asientosDisponibles ?? 0), 0),
      0,
    );
    return `${Math.round((ocupados / capacidad) * 100)}%`;
  }, [vuelos]);

  return (
    <section aria-labelledby="resumen-operativo" className="mt-10 bg-surface-tint">
      <div className="mx-auto w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="resumen-operativo" className="m-0 text-app-section">
            Resumen operativo
          </h2>
          <span className="text-app-label text-ink-muted">Calculado con todos los vuelos y reservas</span>
        </div>

        {error ? (
          <ErrorMessage
            error={error}
            title="No pudimos calcular el resumen"
            onRetry={onRetry}
            retrying={retrying}
            className="mt-5"
          />
        ) : (
          <dl className="m-0 mt-4 grid grid-cols-2 border-t border-line sm:grid-cols-3 lg:grid-cols-6">
            <Metrica label="Programados">{formatearEntero(porEstado.programados)}</Metrica>
            <Metrica label="En vuelo">{formatearEntero(porEstado.enVuelo)}</Metrica>
            <Metrica label="Cancelados">{formatearEntero(porEstado.cancelados)}</Metrica>
            <Metrica label="Finalizados">{formatearEntero(porEstado.finalizados)}</Metrica>
            <Metrica
              label="Reservas"
              nota={`${contarConPalabra(reservasConfirmadas, 'confirmada', 'confirmadas')} · ${contarConPalabra(reservasCanceladas, 'cancelada', 'canceladas')}`}
            >
              {formatearEntero(reservas ? reservas.length : null)}
            </Metrica>
            <Metrica label="Ocupación">{ocupacion ?? '—'}</Metrica>
          </dl>
        )}
      </div>
    </section>
  );
}

function ReservaPreview({ reserva }) {
  return (
    <li className="grid gap-x-5 gap-y-2 border-b border-line py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono text-app-data text-ink">{reserva.numeroVuelo}</span>
          <StatusIndicator estado={reserva.estado} />
        </div>
        <p className="m-0 mt-1.5 text-app-body-sm text-ink-muted">
          Asiento <span className="font-mono text-ink">{reserva.numeroAsiento}</span> · Reserva del{' '}
          <time dateTime={reserva.fechaReserva?.toISOString()}>{formatFechaHora(reserva.fechaReserva)}</time>
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <span className="font-mono text-app-data text-ink">{formatCurrency(reserva.precioPagado)}</span>
        <TextLink as={Link} to={`/dashboard/vuelos/${reserva.vueloId}`} size="sm">
          Ver vuelo
        </TextLink>
      </div>
    </li>
  );
}

export default function DashboardHomePage() {
  const { user, isAdmin } = useAuth();
  const vuelosState = useAsync(vuelosApi.listar);
  const reservasState = useAsync(reservasApi.listar);
  const ahora = useMemo(() => vuelosState.updatedAt ?? new Date(), [vuelosState.updatedAt]);

  const proximos = useMemo(() => {
    if (!vuelosState.data) return [];
    return proximasSalidas(vuelosState.data, ahora)
      .filter((vuelo) => vuelo.estado === 'Programado')
      .slice(0, CANTIDAD_VUELOS);
  }, [vuelosState.data, ahora]);

  const reservas = useMemo(() => {
    if (!reservasState.data) return [];
    return [...reservasState.data].sort((a, b) => (b.fechaReserva ?? 0) - (a.fechaReserva ?? 0)).slice(0, 3);
  }, [reservasState.data]);

  const confirmadas = reservasState.data
    ? reservasState.data.filter((reserva) => reserva.estado === 'Confirmada').length
    : null;
  const canceladas = reservasState.data
    ? reservasState.data.filter((reserva) => reserva.estado === 'Cancelada').length
    : null;

  return (
    <>
      <div className="mx-auto w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] pt-10">
        <PageHeader
          breadcrumb="Cuenta / tablero"
          title={`Hola, ${user.nombre}`}
          lead={`Este es el estado de la operación de hoy, ${formatFechaLarga(new Date())}.`}
        />
      </div>

      {isAdmin && (
        <ResumenOperativo
          vuelos={vuelosState.data}
          reservas={reservasState.data}
          error={vuelosState.error ?? reservasState.error}
          retrying={vuelosState.retrying || reservasState.retrying}
          onRetry={() => {
            if (vuelosState.error) vuelosState.reload();
            if (reservasState.error) reservasState.reload();
          }}
        />
      )}

      <section data-surface="ink" aria-labelledby="proximos-vuelos" className="mt-12 bg-surface-ink text-ink-inverse">
        <div className="mx-auto w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] py-10">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line-inverse-strong pb-4">
            <div>
              <h2 id="proximos-vuelos" className="m-0 text-app-section">
                Próximos vuelos programados
              </h2>
              <p className="m-0 mt-1 text-app-body-sm text-ink-inverse-muted">
                Las salidas más cercanas de la operación.
              </p>
            </div>
            <TextLink as={Link} to="/dashboard/vuelos" tone="ink" size="sm">
              Ver todos los vuelos
            </TextLink>
          </div>

          {vuelosState.error && !vuelosState.data ? (
            <ErrorMessage
              surface="ink"
              error={vuelosState.error}
              title="No pudimos cargar los vuelos"
              onRetry={vuelosState.reload}
              retrying={vuelosState.retrying}
              className="mt-6"
            />
          ) : vuelosState.loading && !vuelosState.data ? (
            <Loading surface="ink" label="Cargando vuelos…" className="mt-6" />
          ) : proximos.length === 0 ? (
            <EmptyState surface="ink" title="No hay vuelos programados próximos" className="mt-6 border-t-0 pt-6">
              Cuando se carguen salidas futuras van a aparecer en este tablero.
            </EmptyState>
          ) : (
            <ol className="m-0 list-none p-0">
              {proximos.map((vuelo) => (
                <VueloRow key={vuelo.id} vuelo={vuelo} ahora={ahora} />
              ))}
            </ol>
          )}
        </div>
      </section>

      <section aria-labelledby="tus-reservas" className="mx-auto mt-12 w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))]">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
          <div>
            <h2 id="tus-reservas" className="m-0 text-app-section">
              Tus reservas
            </h2>
            {reservasState.data && (
              <p aria-live="polite" className="m-0 mt-1 font-mono text-app-label uppercase text-ink-muted">
                {confirmadas} {confirmadas === 1 ? 'confirmada' : 'confirmadas'} · {canceladas}{' '}
                {canceladas === 1 ? 'cancelada' : 'canceladas'}
              </p>
            )}
          </div>
        </div>

        {reservasState.error && !reservasState.data ? (
          <ErrorMessage
            error={reservasState.error}
            title="No pudimos cargar tus reservas"
            onRetry={reservasState.reload}
            retrying={reservasState.retrying}
            className="mt-6"
          />
        ) : reservasState.loading && !reservasState.data ? (
          <Loading rows={3} label="Cargando reservas…" className="mt-6" />
        ) : reservas.length === 0 ? (
          <EmptyState
            title="Todavía no tenés reservas"
            className="mt-2"
            action={
              <TextLink as={Link} to="/dashboard/vuelos" size="sm">
                Ver vuelos disponibles
              </TextLink>
            }
          >
            Cuando reserves un vuelo, el resumen va a aparecer acá.
          </EmptyState>
        ) : (
          <ul className="m-0 list-none border-t border-line p-0">
            {reservas.map((reserva) => (
              <ReservaPreview key={reserva.id} reserva={reserva} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="accesos-directos" className="mx-auto mt-12 w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] border-t border-line pt-8">
        <h2 id="accesos-directos" className="m-0 text-app-section">
          Accesos directos
        </h2>
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-4">
          <TextLink as={Link} to="/dashboard/vuelos">
            Consultar todos los vuelos
          </TextLink>
          {isAdmin && (
            <TextLink as={Link} to="/admin">
              Ir a administración
            </TextLink>
          )}
          <TextLink as={Link} to="/">
            Volver a la landing
          </TextLink>
        </div>
      </section>
    </>
  );
}
