import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
import ResumenReserva from '../components/ResumenReserva.jsx';
import SeatMap, { MarcaLeyenda } from '../components/SeatMap.jsx';
import TextLink from '../components/TextLink.jsx';
import useAsync from '../hooks/useAsync.js';
import useAuth from '../hooks/useAuth.js';
import { agruparEnFilas, etiquetaDeFila } from '../utils/asientos.js';
import { esReservable } from '../utils/vuelos.js';

const SHELL = 'mx-auto w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))]';
// Secuencia: asiento → pasajero → resumen → (confirmar) → comprobante.
const PASOS = { asiento: 0, pasajero: 1, resumen: 2, comprobante: 3 };

// Errores 400 del pasajero que viaja dentro de la reserva ("pasajero.Documento") → campos del formulario.
const CAMPO_FORMULARIO = { nombre: 'nombre', apellido: 'apellido', documento: 'dni', email: 'email', telefono: 'telefono' };

function erroresDelPasajero(fieldErrors = {}) {
  const resultado = {};
  for (const [clave, mensajes] of Object.entries(fieldErrors)) {
    const [raiz, propiedad] = clave.split('.');
    const campo = raiz?.toLowerCase() === 'pasajero' ? CAMPO_FORMULARIO[propiedad?.toLowerCase()] : null;
    if (campo) resultado[campo] = mensajes[0];
  }
  return resultado;
}

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
  // "Pasajero existente" usa GET /pasajeros, que es solo para Administrador: al resto no se le muestra.
  // Un usuario común siempre carga los datos; si el DNI ya existe, el backend reutiliza ese pasajero.
  const { user, isAdmin } = useAuth();
  const ayudaId = useId();
  const encabezado = useRef(null);
  const enviando = useRef(false);

  const { data, error, loading, retrying, updatedAt, reload } = useAsync(() => vuelosApi.obtenerDetalle(id));
  const [asientosFrescos, setAsientosFrescos] = useState(null);
  const [paso, setPaso] = useState('asiento');
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [modo, setModo] = useState('nuevo');
  const [pasajero, setPasajero] = useState(null);
  const [datosNuevo, setDatosNuevo] = useState(null);
  const [pasajeroListo, setPasajeroListo] = useState(false);
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

  function irA(destino) {
    setErrorAccion(null);
    setErroresCampo(null);
    setPaso(destino);
  }

  function elegirModo(nuevo) {
    // Cambiar a "nuevo" descarta al pasajero existente elegido: el resumen usa lo que se cargue.
    if (nuevo === 'nuevo') setPasajero(null);
    setModo(nuevo);
    setErrorAccion(null);
    setErroresCampo(null);
  }

  /**
   * Crea la reserva en un solo pedido. Solo se llama desde el resumen.
   * - Pasajero existente (Administrador): se manda su `pasajeroId`.
   * - Pasajero cargado: viaja dentro de la reserva; el backend lo busca por DNI y, si no existe, lo crea.
   *   Así se puede volver a reservar para alguien que ya viajó (antes POST /pasajeros respondía 409).
   */
  async function confirmar() {
    if (enviando.current || !vuelo || !asiento || (!pasajero && !datosNuevo)) return;

    enviando.current = true;
    setPendiente(true);
    setErrorAccion(null);
    setErroresCampo(null);

    try {
      const creada = await reservasApi.crear(
        pasajero
          ? { pasajeroId: pasajero.id, vueloId: vuelo.id, asientoId: asiento.id }
          : {
              vueloId: vuelo.id,
              asientoId: asiento.id,
              pasajero: {
                nombre: datosNuevo.nombre,
                apellido: datosNuevo.apellido,
                documento: datosNuevo.dni,
                email: datosNuevo.email,
                telefono: datosNuevo.telefono,
              },
            },
      );
      setReserva(creada);
      setPaso('comprobante');
    } catch (fallo) {
      await manejarFallo(fallo);
    } finally {
      enviando.current = false;
      setPendiente(false);
    }
  }

  async function manejarFallo(fallo) {
    // 401: la sesión venció. El cliente ya cerró la sesión y redirige al login con el destino guardado.
    if (fallo.status === 401) return;

    // 400 con errores de los datos del pasajero: se vuelve al formulario con los valores cargados.
    const deCampo = erroresDelPasajero(fallo.fieldErrors);
    if (fallo.status === 400 && Object.keys(deCampo).length > 0) {
      setErroresCampo(deCampo);
      setPaso('pasajero');
      return;
    }

    if (fallo.status === 409) {
      // El 409 no trae un código: se pregunta al servidor si el asiento sigue libre.
      // Si ya no lo está, se vuelve a la selección; si sigue libre, el conflicto es otro y se muestra su mensaje.
      const frescos = await vuelosApi.obtenerAsientos(id).catch(() => null);
      const actual = frescos?.find((a) => a.id === seleccionadoId);

      if (frescos) setAsientosFrescos(frescos);

      if (actual && !actual.disponible) {
        setAsientoTomado(true);
        setSeleccionadoId(null);
        setPaso('asiento');
        setFocusSignal((n) => n + 1);
        return;
      }
    }

    // 404: el vuelo, el asiento o el pasajero ya no existen. Se recarga el vuelo; si desapareció,
    // la pantalla pasa a "Vuelo no encontrado". En cualquier caso se muestra el mensaje del servidor.
    if (fallo.status === 404) reload();

    setErrorAccion(fallo);
  }

  function continuarConNuevo(datos) {
    setDatosNuevo(datos);
    setPasajero(null);
    setPasajeroListo(true);
    irA('resumen');
  }

  function continuarConExistente() {
    setPasajeroListo(true);
    irA('resumen');
  }

  const titulos = {
    asiento: 'Elegí tu asiento',
    pasajero: 'Datos del pasajero',
    resumen: 'Revisá tu reserva',
    comprobante: nombreUsuario ? `Todo listo, ${nombreUsuario}.` : 'Reserva confirmada',
  };
  const leads = {
    asiento: 'Elegí un asiento libre del mapa. Después cargás o elegís al pasajero.',
    pasajero: isAdmin
      ? 'El pasajero es quien viaja. Podés cargar uno nuevo o reutilizar uno existente.'
      : 'Cargá los datos de quien viaja. Si ya viajó antes, usá el mismo DNI y se reutilizan sus datos.',
    resumen: 'Controlá los datos. Al confirmar se crea la reserva y el asiento queda bloqueado.',
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
    const resumenPasajero = pasajero ?? (datosNuevo ? { ...datosNuevo, nombreCompleto: `${datosNuevo.nombre} ${datosNuevo.apellido}` } : null);
    const botonAtras = (texto, destino) => (
      <TextLink as="button" type="button" icon={null} size="sm" onClick={() => irA(destino)}>
        {texto}
      </TextLink>
    );

    let accion;
    let atras;
    let contenido;

    if (paso === 'asiento') {
      accion = (
        // `key` distinta por paso: si React reutilizara el mismo <button>, el clic de "Continuar"
        // terminaría enviando el formulario del pasajero (vacío) apenas se cambia de paso.
        <Button key="continuar" disabled={!asiento} icon="arrow" onClick={() => irA(pasajeroListo ? 'resumen' : 'pasajero')}>
          {pasajeroListo ? 'Volver al resumen' : 'Continuar con el pasajero'}
        </Button>
      );
      atras = asiento && (
        <TextLink as="button" type="button" icon={null} size="sm" onClick={() => setSeleccionadoId(null)}>
          Quitar selección
        </TextLink>
      );
      contenido = (
        <>
          {asientoTomado && (
            <Alert tone="danger" title="Ese asiento acaba de ocuparse" className="mb-8">
              Elegí otro asiento libre del mapa.
            </Alert>
          )}
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
        </>
      );
    } else if (paso === 'pasajero') {
      accion =
        modo === 'nuevo' ? (
          <Button key="revisar-nuevo" type="submit" form="pasajero-form" icon="arrow">
            Revisar reserva
          </Button>
        ) : (
          <Button key="revisar-existente" disabled={!pasajero} icon="arrow" onClick={continuarConExistente}>
            Revisar reserva
          </Button>
        );
      atras = botonAtras('Volver al asiento', 'asiento');
      contenido = (
        <div className="flex max-w-[640px] flex-col gap-6">
          {errorAccion && <ErrorMessage error={errorAccion} title="No pudimos guardar al pasajero" />}

          {isAdmin && (
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
          )}

          {modo === 'nuevo' || !isAdmin ? (
            <PasajeroForm defaultValues={datosNuevo ?? undefined} serverErrors={erroresCampo} onSubmit={continuarConNuevo} />
          ) : (
            <PasajeroSelector seleccionado={pasajero} onSelect={setPasajero} />
          )}
        </div>
      );
    } else {
      accion = (
        <Button key="confirmar" icon="arrow" pending={pendiente} pendingLabel="Creando reserva…" onClick={confirmar}>
          Confirmar reserva
        </Button>
      );
      atras = botonAtras('Volver al pasajero', 'pasajero');
      contenido = (
        <div className="flex flex-col gap-6">
          {errorAccion && (
            <ErrorMessage
              error={errorAccion}
              title="No pudimos crear la reserva"
              onRetry={errorAccion.isNetworkError ? confirmar : undefined}
              retrying={pendiente}
              action={
                errorAccion.status === 404 ? (
                  <Button as={Link} to="/dashboard/vuelos" variant="secondary" size="sm">
                    Volver al listado
                  </Button>
                ) : undefined
              }
            />
          )}
          {asiento && resumenPasajero && (
            <ResumenReserva
              vuelo={vuelo}
              pasajero={resumenPasajero}
              asiento={asiento}
              etiquetaFila={etiquetaFila}
              onCambiarAsiento={() => irA('asiento')}
              onCambiarPasajero={() => irA('pasajero')}
            />
          )}
        </div>
      );
    }

    cuerpo = (
      <div className="grid gap-x-12 gap-y-8 pb-24 md:grid-cols-[minmax(0,1fr)_320px] md:pb-0">
        <div className="min-w-0">{contenido}</div>
        <ReservaResumen
          vuelo={vuelo}
          asiento={asiento}
          etiquetaFila={etiquetaFila}
          pasajero={paso !== 'asiento' ? resumenPasajero?.nombreCompleto : undefined}
          actions={
            <>
              {accion}
              {atras}
            </>
          }
          barAction={accion}
        />
      </div>
    );
  }

  const pasoActual = PASOS[paso];

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
