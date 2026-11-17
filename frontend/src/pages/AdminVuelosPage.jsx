import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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
import Paginacion from '../components/Paginacion.jsx';
import StatusIndicator from '../components/StatusIndicator.jsx';
import TextLink from '../components/TextLink.jsx';
import useAsync from '../hooks/useAsync.js';
import { toApiDateTime } from '../api/adapters.js';
import { toApiError } from '../utils/errors.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatFechaHora, toDateTimeLocal } from '../utils/formatDate.js';
import { paginar, TAMANIO_PAGINA } from '../utils/paginacion.js';

const FORM_VACIO = {
  codigo: '',
  origen: '',
  destino: '',
  fechaSalida: '',
  fechaLlegada: '',
  precio: '',
  cantidadAsientos: '',
  cantidadAsientosEjecutivos: '0',
  estado: '0',
};

const ESTADOS = [
  { value: '0', label: 'Programado' },
  { value: '1', label: 'En vuelo' },
  { value: '2', label: 'Cancelado' },
  { value: '3', label: 'Finalizado' },
];

function formDesdeVuelo(vuelo) {
  return {
    codigo: vuelo.numeroVuelo,
    origen: vuelo.origen,
    destino: vuelo.destino,
    fechaSalida: toDateTimeLocal(vuelo.fechaSalida),
    fechaLlegada: toDateTimeLocal(vuelo.fechaLlegada),
    precio: String(vuelo.precioBase),
    cantidadAsientos: String(vuelo.capacidad),
    cantidadAsientosEjecutivos: '0',
    estado: String(vuelo.estadoCodigo),
  };
}

function primerError(valor) {
  return Array.isArray(valor) ? valor[0] : valor;
}

function validar(formulario, editando) {
  const errores = {};
  const codigo = formulario.codigo.trim();
  const origen = formulario.origen.trim();
  const destino = formulario.destino.trim();
  const salida = formulario.fechaSalida ? new Date(formulario.fechaSalida) : null;
  const llegada = formulario.fechaLlegada ? new Date(formulario.fechaLlegada) : null;
  const precio = Number(formulario.precio);
  const capacidad = Number(formulario.cantidadAsientos);
  const ejecutivos = Number(formulario.cantidadAsientosEjecutivos || 0);

  if (!codigo) errores.codigo = 'Ingresá el código del vuelo.';
  else if (codigo.length > 20) errores.codigo = 'El código no puede superar los 20 caracteres.';

  if (!origen) errores.origen = 'Ingresá el origen.';
  else if (origen.length > 80) errores.origen = 'El origen no puede superar los 80 caracteres.';

  if (!destino) errores.destino = 'Ingresá el destino.';
  else if (destino.length > 80) errores.destino = 'El destino no puede superar los 80 caracteres.';

  if (!salida || Number.isNaN(salida.getTime())) errores.fechaSalida = 'Ingresá una fecha de salida válida.';
  if (!llegada || Number.isNaN(llegada.getTime())) errores.fechaLlegada = 'Ingresá una fecha de llegada válida.';
  if (salida && llegada && !Number.isNaN(salida.getTime()) && !Number.isNaN(llegada.getTime()) && llegada <= salida) {
    errores.fechaLlegada = 'La llegada debe ser posterior a la salida.';
  }

  if (formulario.precio === '' || !Number.isFinite(precio) || precio < 0 || precio > 100000000) {
    errores.precio = 'Ingresá un precio entre 0 y 100.000.000.';
  }

  if (!Number.isInteger(capacidad) || capacidad < 1 || capacidad > 500) {
    errores.cantidadAsientos = 'La capacidad debe ser un número entero entre 1 y 500.';
  }

  if (!editando && (!Number.isInteger(ejecutivos) || ejecutivos < 0 || ejecutivos > capacidad)) {
    errores.cantidadAsientosEjecutivos = 'Los asientos ejecutivos no pueden superar la capacidad.';
  }

  return errores;
}

function AccionesVuelo({ vuelo, onEditar, onEliminar }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <TextLink
        as="button"
        type="button"
        size="sm"
        onClick={(evento) => onEditar(vuelo, evento)}
        aria-label={`Editar vuelo ${vuelo.numeroVuelo}`}
      >
        Editar
      </TextLink>
      <button
        type="button"
        onClick={() => onEliminar(vuelo)}
        aria-label={`Eliminar vuelo ${vuelo.numeroVuelo}`}
        className="min-h-(--size-touch) border-b border-line-strong pb-0.5 font-sans text-app-label font-medium text-danger transition-colors duration-(--duration-state) hover:border-danger"
      >
        Eliminar
      </button>
    </div>
  );
}

export default function AdminVuelosPage() {
  const vuelosState = useAsync(vuelosApi.listar);
  const [formAbierto, setFormAbierto] = useState(false);
  const [vueloEditando, setVueloEditando] = useState(null);
  const [formulario, setFormulario] = useState(FORM_VACIO);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState(null);
  const [anuncio, setAnuncio] = useState('');
  const [pagina, setPagina] = useState(1);
  const triggerRef = useRef(null);

  const vuelos = useMemo(
    () =>
      [...(vuelosState.data ?? [])].sort(
        (a, b) => (a.fechaSalida?.getTime() ?? Infinity) - (b.fechaSalida?.getTime() ?? Infinity),
      ),
    [vuelosState.data],
  );

  // La tabla y la lista de celular muestran la misma página.
  const pagina_ = paginar(vuelos, pagina, TAMANIO_PAGINA);

  const capacidadLegado = Boolean(vueloEditando) && vueloEditando.capacidad < 1;

  function abrirCrear(evento) {
    triggerRef.current = evento?.currentTarget ?? document.activeElement;
    setVueloEditando(null);
    setFormulario(FORM_VACIO);
    setErrores({});
    setErrorGeneral(null);
    setFormAbierto(true);
  }

  function abrirEditar(vuelo, evento) {
    triggerRef.current = evento?.currentTarget ?? document.activeElement;
    setVueloEditando(vuelo);
    setFormulario(formDesdeVuelo(vuelo));
    setErrores({});
    setErrorGeneral(null);
    setFormAbierto(true);
  }

  function cerrarFormulario() {
    setFormAbierto(false);
    setVueloEditando(null);
    setErrores({});
    setErrorGeneral(null);

    const trigger = triggerRef.current;
    if (trigger?.isConnected) trigger.focus();
  }

  function cambiar(campo, valor) {
    setFormulario((previo) => ({ ...previo, [campo]: valor }));
  }

  async function guardar(evento) {
    evento.preventDefault();

    const erroresNuevos = validar(formulario, Boolean(vueloEditando));
    if (Object.keys(erroresNuevos).length > 0) {
      setErrores(erroresNuevos);
      setErrorGeneral(null);
      return;
    }

    const payload = {
      codigo: formulario.codigo.trim(),
      origen: formulario.origen.trim(),
      destino: formulario.destino.trim(),
      fechaSalida: toApiDateTime(new Date(formulario.fechaSalida)),
      fechaLlegada: toApiDateTime(new Date(formulario.fechaLlegada)),
      precio: Number(formulario.precio),
      cantidadAsientos: Number(formulario.cantidadAsientos),
    };

    if (vueloEditando) {
      payload.estado = Number(formulario.estado);
    } else {
      payload.cantidadAsientosEjecutivos = Number(formulario.cantidadAsientosEjecutivos || 0);
    }

    setGuardando(true);
    setErrores({});
    setErrorGeneral(null);

    try {
      if (vueloEditando) {
        await vuelosApi.actualizar(vueloEditando.id, payload);
        setAnuncio(`Vuelo ${payload.codigo} actualizado.`);
      } else {
        await vuelosApi.crear(payload);
        setAnuncio(`Vuelo ${payload.codigo} creado.`);
      }

      cerrarFormulario();
      vuelosState.reload();
    } catch (error) {
      const apiError = toApiError(error);
      const erroresDeCampo = apiError.fieldErrors ?? {};
      setErrores(erroresDeCampo);
      setErrorGeneral(Object.keys(erroresDeCampo).length > 0 ? null : apiError);
    } finally {
      setGuardando(false);
    }
  }

  function pedirEliminar(vuelo) {
    setErrorEliminar(null);
    setAEliminar(vuelo);
  }

  async function confirmarEliminar() {
    if (!aEliminar) return;

    setEliminando(true);
    setErrorEliminar(null);

    try {
      await vuelosApi.eliminar(aEliminar.id);
      setAnuncio(`Vuelo ${aEliminar.numeroVuelo} eliminado.`);
      setAEliminar(null);
      vuelosState.reload();
    } catch (error) {
      setErrorEliminar(toApiError(error));
    } finally {
      setEliminando(false);
    }
  }

  function errorCampo(campo) {
    return primerError(errores[campo]);
  }

  let contenido;

  if (vuelosState.error && !vuelosState.data) {
    contenido = (
      <ErrorMessage
        error={vuelosState.error}
        title={vuelosState.error.status === 403 ? 'Acceso restringido' : 'No pudimos cargar los vuelos'}
        onRetry={vuelosState.error.status === 403 ? undefined : vuelosState.reload}
        retrying={vuelosState.retrying}
        className="mt-6"
      />
    );
  } else if (vuelosState.loading && !vuelosState.data) {
    contenido = <Loading variant="table" label="Cargando vuelos…" className="mt-6" />;
  } else if (vuelos.length === 0) {
    contenido = (
      <EmptyState
        title="No hay vuelos cargados"
        className="mt-6 border-t-0 pt-6"
        action={
          <Button variant="secondary" size="sm" onClick={abrirCrear}>
            Crear el primer vuelo
          </Button>
        }
      >
        Cuando cargues un vuelo, va a aparecer en esta tabla.
      </EmptyState>
    );
  } else {
    contenido = (
      <>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Vuelos cargados</caption>
            <thead>
              <tr className="border-y border-line font-mono text-app-label uppercase text-ink-faint">
                <th scope="col" className="py-3 pr-4 font-normal">Vuelo</th>
                <th scope="col" className="py-3 pr-4 font-normal">Ruta</th>
                <th scope="col" className="py-3 pr-4 font-normal">Salida</th>
                <th scope="col" className="py-3 pr-4 font-normal">Llegada</th>
                <th scope="col" className="py-3 pr-4 font-normal">Asientos</th>
                <th scope="col" className="py-3 pr-4 font-normal">Precio</th>
                <th scope="col" className="py-3 pr-4 font-normal">Estado</th>
                <th scope="col" className="py-3 text-right font-normal">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagina_.items.map((vuelo) => (
                <tr key={vuelo.id} className="border-b border-line align-top">
                  <th scope="row" className="py-4 pr-4 font-mono text-app-data font-medium">
                    <Link to={`/dashboard/vuelos/${vuelo.id}`} className="text-ink underline-offset-4 hover:underline">
                      {vuelo.numeroVuelo}
                    </Link>
                  </th>
                  <td className="py-4 pr-4 text-app-body-sm">
                    {vuelo.origen} a {vuelo.destino}
                  </td>
                  <td className="py-4 pr-4 font-mono text-app-body-sm">{formatFechaHora(vuelo.fechaSalida)}</td>
                  <td className="py-4 pr-4 font-mono text-app-body-sm">{formatFechaHora(vuelo.fechaLlegada)}</td>
                  <td className="py-4 pr-4 font-mono text-app-body-sm">
                    {vuelo.asientosDisponibles} / {vuelo.capacidad}
                  </td>
                  <td className="py-4 pr-4 font-mono text-app-body-sm">{formatCurrency(vuelo.precioBase)}</td>
                  <td className="py-4 pr-4"><StatusIndicator estado={vuelo.estado} /></td>
                  <td className="py-4">
                    <div className="flex justify-end">
                      <AccionesVuelo vuelo={vuelo} onEditar={abrirEditar} onEliminar={pedirEliminar} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="m-0 list-none border-t border-line p-0 md:hidden">
          {pagina_.items.map((vuelo) => (
            <li key={vuelo.id} className="border-b border-line py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="m-0 font-mono text-app-data">{vuelo.numeroVuelo}</p>
                  <p className="m-0 mt-1 text-app-body-sm font-semibold">
                    {vuelo.origen} a {vuelo.destino}
                  </p>
                </div>
                <StatusIndicator estado={vuelo.estado} />
              </div>
              <dl className="m-0 mt-3 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-app-body-sm">
                <div>
                  <dt className="text-app-label uppercase text-ink-faint">Salida</dt>
                  <dd className="m-0">{formatFechaHora(vuelo.fechaSalida)}</dd>
                </div>
                <div>
                  <dt className="text-app-label uppercase text-ink-faint">Llegada</dt>
                  <dd className="m-0">{formatFechaHora(vuelo.fechaLlegada)}</dd>
                </div>
                <div>
                  <dt className="text-app-label uppercase text-ink-faint">Asientos</dt>
                  <dd className="m-0">{vuelo.asientosDisponibles} / {vuelo.capacidad}</dd>
                </div>
                <div>
                  <dt className="text-app-label uppercase text-ink-faint">Precio</dt>
                  <dd className="m-0">{formatCurrency(vuelo.precioBase)}</dd>
                </div>
              </dl>
              <div className="mt-3">
                <AccionesVuelo vuelo={vuelo} onEditar={abrirEditar} onEliminar={pedirEliminar} />
              </div>
            </li>
          ))}
        </ul>

        <Paginacion
          pagina={pagina_.pagina}
          totalPaginas={pagina_.totalPaginas}
          total={pagina_.total}
          tamanio={TAMANIO_PAGINA}
          onCambiar={setPagina}
        />
      </>
    );
  }

  return (
    <>
      <div className="mx-auto w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] pt-10">
        <PageHeader
          breadcrumb="Administración / vuelos"
          title="Gestión de vuelos"
          lead="Creá, editá y eliminá vuelos. La capacidad y los asientos se generan automáticamente al crear."
          actions={
            <Button variant="primary" size="sm" onClick={abrirCrear}>
              Nuevo vuelo
            </Button>
          }
        />

        <AdminTabs />

        <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {anuncio}
        </p>

        {formAbierto && (
          <section aria-labelledby="formulario-vuelo" className="mt-8 border border-line bg-surface-tint p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="formulario-vuelo" className="m-0 text-app-section">
                {vueloEditando ? 'Editar vuelo' : 'Nuevo vuelo'}
              </h2>
              <button
                type="button"
                onClick={cerrarFormulario}
                className="min-h-(--size-touch) border-b border-line-strong pb-0.5 font-sans text-app-body-sm font-medium text-ink-muted transition-colors duration-(--duration-state) hover:border-ink hover:text-ink"
              >
                Cerrar
              </button>
            </div>

            {!vueloEditando && (
              <Alert tone="info" title="Los asientos se generan automáticamente" className="mt-4">
                El sistema crea los asientos al guardar. Los primeros que indiques serán ejecutivos; el resto, turista.
              </Alert>
            )}

            {capacidadLegado && (
              <Alert tone="warning" title="Este vuelo no tiene asientos generados" className="mt-4">
                Indicá una capacidad entre 1 y 500 para regularizarlo y poder guardar los cambios.
              </Alert>
            )}

            {errorGeneral && (
              <Alert
                tone="danger"
                role="alert"
                title={errorGeneral.status === 403 ? 'Acceso restringido' : 'No se pudo guardar el vuelo'}
                className="mt-4"
              >
                {errorGeneral.status === 403
                  ? 'Tu usuario no tiene permisos para modificar vuelos.'
                  : errorGeneral.message}
              </Alert>
            )}

            <form className="mt-5" onSubmit={guardar} noValidate>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <FormField
                  label="Código de vuelo"
                  value={formulario.codigo}
                  onChange={(evento) => cambiar('codigo', evento.target.value)}
                  error={errorCampo('codigo')}
                  maxLength={20}
                  readOnly={Boolean(vueloEditando)}
                  autoFocus={!vueloEditando}
                  help={vueloEditando ? 'El código no se edita desde esta pantalla.' : 'Por ejemplo, AR1234.'}
                  required
                />
                <FormField
                  label="Origen"
                  value={formulario.origen}
                  onChange={(evento) => cambiar('origen', evento.target.value)}
                  error={errorCampo('origen')}
                  maxLength={80}
                  autoFocus={Boolean(vueloEditando)}
                  required
                />
                <FormField
                  label="Destino"
                  value={formulario.destino}
                  onChange={(evento) => cambiar('destino', evento.target.value)}
                  error={errorCampo('destino')}
                  maxLength={80}
                  required
                />
                <FormField
                  label="Salida"
                  type="datetime-local"
                  value={formulario.fechaSalida}
                  onChange={(evento) => cambiar('fechaSalida', evento.target.value)}
                  error={errorCampo('fechaSalida')}
                  required
                />
                <FormField
                  label="Llegada"
                  type="datetime-local"
                  value={formulario.fechaLlegada}
                  onChange={(evento) => cambiar('fechaLlegada', evento.target.value)}
                  error={errorCampo('fechaLlegada')}
                  help="Debe ser posterior a la salida."
                  required
                />
                <FormField
                  label="Precio base"
                  type="number"
                  min="0"
                  max="100000000"
                  step="0.01"
                  mono
                  value={formulario.precio}
                  onChange={(evento) => cambiar('precio', evento.target.value)}
                  error={errorCampo('precio')}
                  required
                />
                <FormField
                  label="Capacidad"
                  type="number"
                  min="1"
                  max="500"
                  mono
                  value={formulario.cantidadAsientos}
                  onChange={(evento) => cambiar('cantidadAsientos', evento.target.value)}
                  error={errorCampo('cantidadAsientos')}
                  readOnly={Boolean(vueloEditando) && !capacidadLegado}
                  help={
                    capacidadLegado
                      ? 'Regularizá la capacidad para generar los asientos.'
                      : vueloEditando
                        ? 'La capacidad no se edita desde esta pantalla.'
                        : 'Entre 1 y 500 asientos.'
                  }
                  required
                />
                {!vueloEditando && (
                  <FormField
                    label="Asientos ejecutivos"
                    type="number"
                    min="0"
                    max={formulario.cantidadAsientos || 500}
                    step="1"
                    mono
                    optional
                    value={formulario.cantidadAsientosEjecutivos}
                    onChange={(evento) => cambiar('cantidadAsientosEjecutivos', evento.target.value)}
                    error={errorCampo('cantidadAsientosEjecutivos')}
                    help="No puede superar la capacidad total."
                  />
                )}
                {vueloEditando && (
                  <FormField
                    label="Estado"
                    control="select"
                    value={formulario.estado}
                    onChange={(evento) => cambiar('estado', evento.target.value)}
                  >
                    {ESTADOS.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </FormField>
                )}
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <Button variant="secondary" onClick={cerrarFormulario}>
                  Cancelar
                </Button>
                <Button type="submit" pending={guardando} pendingLabel="Guardando…">
                  {vueloEditando ? 'Guardar cambios' : 'Crear vuelo'}
                </Button>
              </div>
            </form>
          </section>
        )}

        {vuelosState.error && vuelosState.data && (
          <Alert
            tone="warning"
            title="No pudimos actualizar los vuelos"
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
            La tabla muestra los datos de la última carga.
          </Alert>
        )}

        <section aria-label="Listado de vuelos" className="mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <p aria-live="polite" className="m-0 font-mono text-app-label uppercase text-ink-muted">
              {vuelosState.data
                ? `${vuelos.length} ${vuelos.length === 1 ? 'vuelo cargado' : 'vuelos cargados'}`
                : 'Cargando vuelos…'}
            </p>
            {vuelosState.updatedAt && (
              <span className="font-mono text-app-label uppercase text-ink-faint">
                Actualizado {formatFechaHora(vuelosState.updatedAt)}
              </span>
            )}
          </div>

          {contenido}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(aEliminar)}
        title="¿Eliminar el vuelo?"
        description={
          aEliminar
            ? `Se eliminará ${aEliminar.numeroVuelo}. Si el vuelo tiene reservas, el sistema no permite eliminarlo; en ese caso podés cambiarlo a Cancelado desde Editar. Esta acción no se puede deshacer.`
            : ''
        }
        summary={
          aEliminar ? (
            <div className="text-app-body-sm">
              <p className="m-0 font-mono text-app-data">{aEliminar.numeroVuelo}</p>
              <p className="m-0 mt-1">
                {aEliminar.origen} a {aEliminar.destino}
              </p>
              <p className="m-0 mt-1 font-mono text-app-label uppercase text-ink-faint">
                {formatFechaHora(aEliminar.fechaSalida)}
              </p>
            </div>
          ) : null
        }
        confirmLabel="Eliminar vuelo"
        pendingLabel="Eliminando…"
        pending={eliminando}
        error={errorEliminar}
        errorTitle={errorEliminar?.status === 403 ? 'Acceso restringido' : 'No se pudo eliminar el vuelo'}
        onConfirm={confirmarEliminar}
        onClose={() => setAEliminar(null)}
      />
    </>
  );
}
