import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import pasajerosApi from '../api/pasajerosApi.js';
import reservasApi from '../api/reservasApi.js';
import vuelosApi from '../api/vuelosApi.js';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import ComprobanteReserva from '../components/ComprobanteReserva.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loading from '../components/Loading.jsx';
import PageHeader from '../components/PageHeader.jsx';
import PasajeroForm from '../components/PasajeroForm.jsx';
import PasajeroSelector from '../components/PasajeroSelector.jsx';
import ReservaPasos from '../components/ReservaPasos.jsx';
import ReservaResumen from '../components/ReservaResumen.jsx';
import SeatMap, { MarcaLeyenda } from '../components/SeatMap.jsx';
import TextLink from '../components/TextLink.jsx';
import useAsync from '../hooks/useAsync.js';
import useAuth from '../hooks/useAuth.js';
import { agruparEnFilas, etiquetaDeFila } from '../utils/asientos.js';
import { esReservable } from '../utils/vuelos.js';

const SHELL = 'mx-auto w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))]';
const CAMPOS_PASAJERO = ['nombre', 'apellido', 'dni', 'email', 'telefono'];

function VolverAlVuelo({ id }) {
  return (
    <Button as={Link} to={`/dashboard/vuelos/${id}`} variant="secondary" size="sm">
      Volver al vuelo
    </Button>
  );
}

function Leyenda({ id }) {
  return (
    <div className="flex flex-col gap-4 lg:w-60 lg:shrink-0">
      <ul aria-label="Leyenda" className="m-0 flex list-none flex-wrap gap-x-6 gap-y-3 p-0 lg:flex-col">
        {[
          ['libre', 'Libre'],
          ['seleccionado', 'Seleccionado'],
          ['ocupado', 'Ocupado'],
        ].map(([estado, texto]) => (
          <li key={estado} className="flex items-center gap-2.5 text-app-body-sm">
            <MarcaLeyenda estado={estado} />
            {texto}
          </li>
        ))}
      </ul>
      <p id={id} className="m-0 max-w-[52ch] text-app-body-sm text-ink-muted">
        Usá las flechas para moverte entre asientos y Enter o Espacio para elegir. Ejecutivo 2+2 · Turista 3+3.
      </p>
    </div>
  );
}

function Reservar({ id }) {
  const { user } = useAuth();
  const ayudaId = useId();
  const encabezado = useRef(null);
  const enviando = useRef(false);
  const ultimosDatos = useRef(null);

  const { data, error, loading, retrying, updatedAt, reload } = useAsync(() => vuelosApi.obtenerDetalle(id));
  const [asientosFrescos, setAsientosFrescos] = useState(null);
  const [paso, setPaso] = useState('asiento');
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [modo, setModo] = useState('nuevo');
  const [pasajero, setPasajero] = useState(null);
  const [reserva, setReserva] = useState(null);
  const [pendiente, setPendiente] = useState(false);
  const [errorAccion, setErrorAccion] = useState(null);
  const [erroresCampo, setErroresCampo] = useState(null);
  const [asientoTomado, setAsientoTomado] = useState(false);
  const [focusSignal, setFocusSignal] = useState(0);

  const vuelo = data?.vuelo ?? null;
  const asientos = useMemo(() => asientosFrescos ?? data?.asientos ?? [], [asientosFrescos, data]);
  const asiento = asientos.find((a) => a.id === seleccionadoId) ?? null;
  const grupos = useMemo(() => agruparEnFilas(asientos), [asientos]);
  const etiquetaFila = asiento ? etiquetaDeFila(grupos, asiento.id) : null;
  const ahora = useMemo(() => updatedAt ?? new Date(), [updatedAt]);
  const es404 = error?.status === 404;
  const reservable = vuelo ? esReservable(vuelo, ahora) : false;
  const nombreUsuario = user?.nombre?.split(' ')[0] ?? '';

  // Al cambiar de paso, el foco va al título para que el cambio se anuncie.
  useEffect(() => {
    if (paso !== 'asiento') encabezado.current?.focus();
  }, [paso]);

  async function refrescarAsientos() {
    try {
      setAsientosFrescos(await vuelosApi.obtenerAsientos(id));
    } catch {
      // Si falla la recarga, el siguiente intento de reserva vuelve a avisar.
    }
  }

  function elegirModo(nuevo) {
    setModo(nuevo);
    setErrorAccion(null);
    setErroresCampo(null);
  }

  async function confirmar(datosNuevo) {
    if (enviando.current || !vuelo || !asiento) return;

    enviando.current = true;
    ultimosDatos.current = datosNuevo ?? null;
    setPendiente(true);
    setErrorAccion(null);
    setErroresCampo(null);

    let elegido = pasajero;
    let etapa = 'pasajero';

    try {
      if (!elegido) {
        elegido = await pasajerosApi.crear(datosNuevo);
        // Si la reserva falla después, el pasajero ya existe: se reutiliza en el reintento.
        setPasajero(elegido);
        setModo('existente');
      }

      etapa = 'reserva';
      const creada = await reservasApi.crear({ pasajeroId: elegido.id, vueloId: vuelo.id, asientoId: asiento.id });
      setReserva(creada);
      setPaso('comprobante');
    } catch (fallo) {
      if (etapa === 'pasajero') {
        // Falló el alta del pasajero: 409 (DNI repetido) o validación de campos.
        manejarFalloPasajero(fallo);
      } else if (fallo.status === 409 && /asiento/i.test(fallo.message)) {
        // Otro usuario tomó el asiento: se recarga el mapa y se vuelve a la selección.
        setAsientoTomado(true);
        setSeleccionadoId(null);
        setPaso('asiento');
        setFocusSignal((n) => n + 1);
        await refrescarAsientos();
      } else {
        setErrorAccion(fallo);
      }
    } finally {
      enviando.current = false;
      setPendiente(false);
    }
  }

  function manejarFalloPasajero(fallo) {
    const porCampo = CAMPOS_PASAJERO.filter((campo) => fallo.fieldErrors?.[campo]);

    if (porCampo.length > 0) {
      setErroresCampo(Object.fromEntries(porCampo.map((campo) => [campo, fallo.fieldErrors[campo][0]])));
    } else if (fallo.status === 409) {
      setErroresCampo({ dni: 'Ya existe un pasajero con ese DNI. Buscalo en "Pasajero existente".' });
    } else {
      setErrorAccion(fallo);
    }
  }

  const titulos = {
    asiento: 'Elegí tu asiento',
    pasajero: 'Datos del pasajero',
    comprobante: nombreUsuario ? `Todo listo, ${nombreUsuario}.` : 'Reserva confirmada',
  };
  const leads = {
    asiento: 'Elegí un asiento libre del mapa. Después cargás o elegís al pasajero.',
    pasajero: 'El pasajero es quien viaja. Podés cargar uno nuevo o reutilizar uno existente.',
    comprobante: 'Guardá el comprobante: el asiento ya está bloqueado a nombre del pasajero.',
  };

  let cuerpo;

  if (error) {
    cuerpo = (
      <ErrorMessage
        error={error}
        title={es404 ? 'Vuelo no encontrado' : 'No pudimos cargar el vuelo'}
        onRetry={es404 ? undefined : reload}
        retrying={retrying}
        action={
          es404 ? (
            <Button as={Link} to="/dashboard/vuelos" variant="secondary" size="sm">
              Volver al listado
            </Button>
          ) : undefined
        }
      />
    );
  } else if (loading && !vuelo) {
    cuerpo = <Loading variant="rows" label="Cargando los asientos…" />;
  } else if (paso === 'comprobante' && reserva) {
    cuerpo = <ComprobanteReserva reserva={reserva} />;
  } else if (vuelo && !reservable) {
    cuerpo = (
      <Alert tone="warning" title="Este vuelo no se puede reservar" action={<VolverAlVuelo id={id} />}>
        {vuelo.estado !== 'Programado'
          ? `Estado actual: ${vuelo.estado}. Solo se pueden reservar vuelos programados.`
          : 'La salida ya ocurrió. Elegí un vuelo futuro desde el listado.'}
      </Alert>
    );
  } else if (vuelo && asientos.length === 0) {
    cuerpo = (
      <EmptyState title="No hay asientos para este vuelo" action={<VolverAlVuelo id={id} />}>
        El vuelo no tiene asientos cargados, así que no se puede reservar.
      </EmptyState>
    );
  } else if (vuelo) {
    const enPasajero = paso === 'pasajero';
    const accionAsiento = (
      <Button disabled={!asiento} icon="arrow" onClick={() => setPaso('pasajero')}>
        Continuar con el pasajero
      </Button>
    );
    const accionReserva = (
      <Button
        icon="arrow"
        pending={pendiente}
        pendingLabel="Creando reserva…"
        disabled={modo === 'existente' && !pasajero}
        {...(modo === 'nuevo' ? { type: 'submit', form: 'pasajero-form' } : { onClick: () => confirmar() })}
      >
        Crear reserva
      </Button>
    );

    cuerpo = (
      <div className="grid gap-x-12 gap-y-8 pb-24 md:grid-cols-[minmax(0,1fr)_320px] md:pb-0">
        <div className="min-w-0">
          {asientoTomado && !enPasajero && (
            <Alert tone="danger" title="Ese asiento acaba de ocuparse" className="mb-8">
              Elegí otro asiento libre del mapa.
            </Alert>
          )}

          {!enPasajero ? (
            <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
              <div className="order-2 min-w-0 flex-1 lg:order-1">
                <SeatMap
                  asientos={asientos}
                  seleccionadoId={seleccionadoId}
                  onSelect={(elegido) => {
                    setSeleccionadoId(elegido?.id ?? null);
                    setAsientoTomado(false);
                  }}
                  focusSignal={focusSignal}
                  ayudaId={ayudaId}
                />
              </div>
              <div className="order-1 lg:order-2">
                <Leyenda id={ayudaId} />
              </div>
            </div>
          ) : (
            <div className="flex max-w-[640px] flex-col gap-6">
              {errorAccion && (
                <ErrorMessage
                  error={errorAccion}
                  title="No pudimos crear la reserva"
                  onRetry={errorAccion.isNetworkError ? () => confirmar(ultimosDatos.current ?? undefined) : undefined}
                  retrying={pendiente}
                />
              )}

              <div role="group" aria-label="Tipo de pasajero" className="flex gap-6 border-b border-line">
                {[
                  ['nuevo', 'Pasajero nuevo'],
                  ['existente', 'Pasajero existente'],
                ].map(([valor, texto]) => (
                  <button
                    key={valor}
                    type="button"
                    aria-pressed={modo === valor}
                    onClick={() => elegirModo(valor)}
                    className={`min-h-(--size-touch) border-b-2 text-app-body-sm transition-colors duration-(--duration-state) ${modo === valor ? 'border-accent text-ink' : 'border-transparent text-ink-faint hover:text-ink'}`}
                  >
                    {texto}
                  </button>
                ))}
              </div>

              {modo === 'nuevo' ? (
                <PasajeroForm serverErrors={erroresCampo} onSubmit={confirmar} />
              ) : (
                <PasajeroSelector seleccionado={pasajero} onSelect={setPasajero} />
              )}

              <TextLink as="button" type="button" icon={null} onClick={() => setPaso('asiento')} className="self-start">
                Volver al asiento
              </TextLink>
            </div>
          )}
        </div>

        <ReservaResumen
          vuelo={vuelo}
          asiento={asiento}
          etiquetaFila={etiquetaFila}
          pasajero={pasajero?.nombreCompleto}
          actions={
            enPasajero ? (
              accionReserva
            ) : (
              <>
                {accionAsiento}
                {asiento && (
                  <TextLink as="button" type="button" icon={null} size="sm" onClick={() => setSeleccionadoId(null)}>
                    Quitar selección
                  </TextLink>
                )}
              </>
            )
          }
          barAction={enPasajero ? accionReserva : accionAsiento}
        />
      </div>
    );
  }

  const pasoActual = { asiento: 0, pasajero: 1, comprobante: 2 }[paso];

  return (
    <div className={`${SHELL} py-10`}>
      <PageHeader
        breadcrumb={`Tablero / vuelos / ${vuelo?.numeroVuelo ?? id} / reservar`}
        title={<span ref={encabezado} tabIndex={-1} className="outline-none">{titulos[paso]}</span>}
        lead={leads[paso]}
        actions={paso === 'comprobante' ? null : <VolverAlVuelo id={id} />}
      />
      {vuelo && !error && <ReservaPasos actual={pasoActual} className="mt-6" />}
      <div className="mt-8">{cuerpo}</div>
    </div>
  );
}

/** Se remonta al cambiar de vuelo (`key`): el flujo empieza limpio en cada vuelo. */
export default function ReservarPage() {
  const { id } = useParams();
  return <Reservar key={id} id={id} />;
}
