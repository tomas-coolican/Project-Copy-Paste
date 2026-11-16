import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import reservasApi from '../api/reservasApi.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import Alert from './Alert.jsx';
import Button from './Button.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import FormField from './FormField.jsx';
import PaseReserva from './PaseReserva.jsx';

// Mismas reglas que PasajeroReservaDTO en el backend.
const DOCUMENTO_VALIDO = /^[A-Za-z0-9]{6,20}$/;
const RECARGO_EJECUTIVO = 1.5;
const CATEGORIAS = ['Ejecutivo', 'Turista'];

const ASIENTO_BASE =
  'inline-flex size-(--size-touch) items-center justify-center rounded-control border font-mono text-app-body-sm transition-colors duration-(--duration-state)';
const ASIENTO_ESTADO = {
  libre: 'border-line-strong bg-surface text-ink hover:border-ink',
  elegido: 'border-accent bg-accent text-accent-ink',
  ocupado: 'cursor-not-allowed border-line bg-surface-tint text-ink-faint line-through',
};

/** Los errores 400 de campos anidados llegan como "pasajero.Nombre": se asocian por la última parte. */
function campoDelServidor(clave) {
  return clave.split('.').pop().toLowerCase();
}

function precioDe(vuelo, asiento) {
  if (!asiento) return null;
  return asiento.categoria === 'Ejecutivo' ? vuelo.precioBase * RECARGO_EJECUTIVO : vuelo.precioBase;
}

function Leyenda() {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 font-mono text-app-label uppercase text-ink-faint">
      <li className="inline-flex items-center gap-2">
        <span aria-hidden="true" className={`${ASIENTO_BASE} ${ASIENTO_ESTADO.libre} size-4`} /> Libre
      </li>
      <li className="inline-flex items-center gap-2">
        <span aria-hidden="true" className={`${ASIENTO_BASE} ${ASIENTO_ESTADO.elegido} size-4`} /> Elegido
      </li>
      <li className="inline-flex items-center gap-2">
        <span aria-hidden="true" className={`${ASIENTO_BASE} ${ASIENTO_ESTADO.ocupado} size-4`} /> Ocupado
      </li>
    </ul>
  );
}

/**
 * Selección de asiento + datos del pasajero para POST /api/reservas.
 * La disponibilidad viene del detalle del vuelo; ante un 409 (otro usuario ocupó el asiento)
 * se pide al padre que recargue el vuelo con `onCambio`.
 */
export default function ReservarAsiento({ vuelo, onCambio }) {
  const [asientoId, setAsientoId] = useState(null);
  const [faltaAsiento, setFaltaAsiento] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [confirmada, setConfirmada] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onBlur', defaultValues: { nombre: '', apellido: '', documento: '' } });

  const porCategoria = useMemo(
    () =>
      CATEGORIAS.map((categoria) => ({
        categoria,
        asientos: vuelo.asientos.filter((asiento) => asiento.categoria === categoria),
      })).filter((grupo) => grupo.asientos.length > 0),
    [vuelo.asientos],
  );

  // Si al recargar el asiento elegido quedó ocupado, se descarta la selección.
  const elegido = vuelo.asientos.find((asiento) => asiento.id === asientoId && asiento.disponible) ?? null;
  const libres = vuelo.asientos.filter((asiento) => asiento.disponible).length;
  const precio = precioDe(vuelo, elegido);

  function elegir(asiento) {
    setAsientoId(asiento.id);
    setFaltaAsiento(false);
    setErrorEnvio(null);
  }

  async function onSubmit(datos) {
    setErrorEnvio(null);
    setConfirmada(null);

    if (!elegido) {
      setFaltaAsiento(true);
      return;
    }

    try {
      const reserva = await reservasApi.crear({
        vueloId: vuelo.id,
        asientoId: elegido.id,
        pasajero: {
          nombre: datos.nombre.trim(),
          apellido: datos.apellido.trim(),
          documento: datos.documento.trim(),
        },
      });

      setConfirmada(reserva);
      setAsientoId(null);
      reset();
      onCambio?.();
    } catch (error) {
      const campos = Object.entries(error.fieldErrors ?? {});
      const conocidos = campos.filter(([clave]) => ['nombre', 'apellido', 'documento'].includes(campoDelServidor(clave)));

      if (conocidos.length > 0) {
        conocidos.forEach(([clave, mensajes]) =>
          setError(campoDelServidor(clave), { type: 'server', message: mensajes[0] }),
        );
        return;
      }

      setErrorEnvio(error);
      // 409: el asiento pudo haberse ocupado mientras tanto; se refresca la disponibilidad.
      if (error.status === 409) onCambio?.();
    }
  }

  if (libres === 0 && !confirmada) {
    return (
      <Alert tone="warning" title="No quedan asientos disponibles">
        Todos los asientos de este vuelo están reservados. Elegí otro vuelo desde el listado.
      </Alert>
    );
  }

  return (
    <section aria-labelledby="reservar-asiento">
      <h2 id="reservar-asiento" className="m-0 text-app-section">
        Reservá tu asiento
      </h2>
      <p className="m-0 mt-1 text-app-body-sm text-ink-muted">
        {libres} {libres === 1 ? 'asiento libre' : 'asientos libres'}. Los asientos ejecutivos tienen un recargo del 50 %.
      </p>

      {confirmada && (
        <div className="mt-6 flex flex-wrap items-start gap-x-8 gap-y-6">
          <Alert
            tone="success"
            title="Reserva confirmada"
            className="min-w-[260px] flex-1"
            meta={`Reserva #${confirmada.id}`}
            action={
              <Button as={Link} to="/dashboard/reservas" variant="secondary" size="sm">
                Ver mis reservas
              </Button>
            }
          >
            Asiento {confirmada.numeroAsiento} a nombre de {confirmada.nombrePasajero} ·{' '}
            {formatCurrency(confirmada.precioPagado)}. El pase de abordar también queda en Mis reservas.
          </Alert>
          <PaseReserva reserva={confirmada} className="w-full sm:w-[340px]" />
        </div>
      )}

      <div className="mt-6 grid gap-x-10 gap-y-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div>
          <Leyenda />
          {porCategoria.map((grupo) => (
            <fieldset key={grupo.categoria} className="m-0 mt-5 border-0 border-t border-line p-0 pt-4">
              <legend className="float-left mb-3 w-full font-mono text-app-label uppercase text-ink-faint">
                {grupo.categoria}
              </legend>
              <div className="clear-both flex flex-wrap gap-2">
                {grupo.asientos.map((asiento) => {
                  const estado = !asiento.disponible ? 'ocupado' : asiento.id === elegido?.id ? 'elegido' : 'libre';

                  return (
                    <button
                      key={asiento.id}
                      type="button"
                      disabled={!asiento.disponible}
                      aria-pressed={estado === 'elegido'}
                      aria-label={`Asiento ${asiento.numero}, ${asiento.categoria}, ${asiento.disponible ? 'libre' : 'ocupado'}`}
                      onClick={() => elegir(asiento)}
                      className={`${ASIENTO_BASE} ${ASIENTO_ESTADO[estado]}`}
                    >
                      {asiento.numero}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="border-b border-line pb-4">
            <p className="m-0 font-mono text-app-label uppercase text-ink-faint">Asiento elegido</p>
            <p className="m-0 mt-1 font-mono text-app-data text-ink" aria-live="polite">
              {elegido ? `${elegido.numero} · ${elegido.categoria} · ${formatCurrency(precio)}` : 'Ninguno'}
            </p>
            {faltaAsiento && (
              <p role="alert" className="m-0 mt-1 text-app-body-sm text-danger">
                Elegí un asiento libre para continuar.
              </p>
            )}
          </div>

          <FormField
            label="Nombre del pasajero"
            autoComplete="given-name"
            error={errors.nombre?.message}
            {...register('nombre', {
              validate: (valor) => valor.trim().length > 0 || 'Ingresá el nombre del pasajero.',
              maxLength: { value: 60, message: 'El nombre admite hasta 60 caracteres.' },
            })}
          />
          <FormField
            label="Apellido del pasajero"
            autoComplete="family-name"
            error={errors.apellido?.message}
            {...register('apellido', {
              validate: (valor) => valor.trim().length > 0 || 'Ingresá el apellido del pasajero.',
              maxLength: { value: 60, message: 'El apellido admite hasta 60 caracteres.' },
            })}
          />
          <FormField
            label="Documento"
            mono
            inputMode="text"
            help="DNI o pasaporte, sin puntos ni espacios."
            error={errors.documento?.message}
            {...register('documento', {
              required: 'Ingresá el documento del pasajero.',
              validate: (valor) =>
                DOCUMENTO_VALIDO.test(valor.trim()) || 'Ingresá entre 6 y 20 letras o números, sin puntos ni espacios.',
            })}
          />

          {errorEnvio && <ErrorMessage error={errorEnvio} title="No pudimos confirmar la reserva" />}

          <Button type="submit" className="w-full" pending={isSubmitting} pendingLabel="Reservando…">
            Confirmar reserva
          </Button>
        </form>
      </div>
    </section>
  );
}
