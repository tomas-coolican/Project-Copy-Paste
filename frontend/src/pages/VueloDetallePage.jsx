import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import vuelosApi from '../api/vuelosApi.js';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import FlightTicket from '../components/FlightTicket.jsx';
import Loading from '../components/Loading.jsx';
import PageHeader from '../components/PageHeader.jsx';
import useAsync from '../hooks/useAsync.js';
import { esReservable } from '../utils/vuelos.js';
import { formatFechaLarga } from '../utils/formatDate.js';

function VolverAlListado() {
  return (
    <Button as={Link} to="/dashboard/vuelos" variant="secondary" size="sm">
      Volver al listado
    </Button>
  );
}

function VueloDetalle({ id }) {
  const { data: vuelo, error, loading, retrying, updatedAt, reload } = useAsync(() => vuelosApi.obtener(id));
  const ahora = useMemo(() => updatedAt ?? new Date(), [updatedAt]);
  const es404 = error?.status === 404;
  const errorMostrado = es404
    ? { ...error, message: 'El vuelo que buscás no existe o fue eliminado del sistema.' }
    : error;
  const reservable = vuelo ? esReservable(vuelo, ahora) : false;

  return (
    <>
      <div className="mx-auto w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] pt-10">
        <PageHeader
          breadcrumb={`Tablero / vuelos / ${vuelo?.numeroVuelo ?? id}`}
          title="Detalle del vuelo"
          lead={
            es404
              ? 'No encontramos un vuelo con ese identificador.'
              : vuelo
                ? `${vuelo.origen} a ${vuelo.destino} · ${formatFechaLarga(vuelo.fechaSalida)}`
                : 'Consultá los datos completos del vuelo.'
          }
          actions={<VolverAlListado />}
        />
      </div>

      {error ? (
        <div className="mx-auto mt-8 w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))]">
          <ErrorMessage
            error={errorMostrado}
            title={es404 ? 'Vuelo no encontrado' : 'No pudimos cargar el vuelo'}
            onRetry={es404 ? undefined : reload}
            retrying={retrying}
            action={es404 ? <VolverAlListado /> : undefined}
          />
        </div>
      ) : loading && !vuelo ? (
        <div className="mx-auto mt-8 w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))]">
          <Loading variant="panel" label="Cargando el vuelo…" />
        </div>
      ) : vuelo ? (
        <>
          <section aria-label="Ficha del vuelo" className="mt-8 bg-surface-band py-10">
            <div className="mx-auto w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))]">
              <FlightTicket vuelo={vuelo} />
            </div>
          </section>

          <div className="mx-auto mt-8 w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))]">
            {!reservable ? (
              <Alert tone="warning" title="Este vuelo no se puede reservar">
                {vuelo.estado !== 'Programado'
                  ? `Estado actual: ${vuelo.estado}. Solo se pueden reservar vuelos programados.`
                  : 'La salida ya ocurrió. Elegí un vuelo futuro desde el listado.'}
              </Alert>
            ) : (
              <Alert tone="info" title="La selección de asientos todavía no está disponible">
                El backend aún no expone los asientos del vuelo. Podés consultar sus datos, pero la reserva no está
                habilitada en esta versión.
              </Alert>
            )}
          </div>
        </>
      ) : null}
    </>
  );
}

/**
 * El detalle se remonta al cambiar de id (`key`), así useAsync vuelve a pedir los datos.
 * El 404 del vuelo se muestra como "Vuelo no encontrado"; una ruta inexistente tiene su propia pantalla.
 */
export default function VueloDetallePage() {
  const { id } = useParams();
  return <VueloDetalle key={id} id={id} />;
}
