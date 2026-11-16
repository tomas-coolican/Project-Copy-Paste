import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toApiDateTime } from '../api/adapters.js';
import Button from './Button.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import FormField from './FormField.jsx';

const ESTADOS = [
  { codigo: 0, label: 'Programado' },
  { codigo: 1, label: 'En vuelo' },
  { codigo: 2, label: 'Cancelado' },
  { codigo: 3, label: 'Finalizado' },
];

/** Date → "2026-12-01T11:30" en hora local, para <input type="datetime-local">. */
function aInputLocal(fecha) {
  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) return '';
  const dos = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}

function valoresIniciales(vuelo) {
  if (!vuelo) {
    return {
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
  }

  return {
    codigo: vuelo.numeroVuelo,
    origen: vuelo.origen,
    destino: vuelo.destino,
    fechaSalida: aInputLocal(vuelo.fechaSalida),
    fechaLlegada: aInputLocal(vuelo.fechaLlegada),
    precio: String(vuelo.precioBase),
    cantidadAsientos: String(vuelo.capacidad),
    cantidadAsientosEjecutivos: '0',
    estado: String(vuelo.estadoCodigo ?? 0),
  };
}

const CAMPOS = [
  'codigo',
  'origen',
  'destino',
  'fechaSalida',
  'fechaLlegada',
  'precio',
  'cantidadAsientos',
  'cantidadAsientosEjecutivos',
  'estado',
];

/**
 * Alta y edición de vuelos (solo Administrador). Las reglas replican VueloEntradaDTO:
 * campos obligatorios, llegada posterior a la salida, precio no negativo, de 1 a 500 asientos.
 * Las fechas se ingresan en hora local y se envían en UTC (contrato 4.2).
 * `onGuardar(dto)` hace la petición; si falla, los 400 se muestran por campo y el resto arriba del botón.
 */
export default function VueloForm({ vuelo, onGuardar, onCancelar }) {
  const editando = Boolean(vuelo);
  const [errorEnvio, setErrorEnvio] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onBlur', defaultValues: valoresIniciales(vuelo) });

  async function onSubmit(datos) {
    setErrorEnvio(null);

    const dto = {
      codigo: datos.codigo.trim().toUpperCase(),
      origen: datos.origen.trim(),
      destino: datos.destino.trim(),
      fechaSalida: toApiDateTime(datos.fechaSalida),
      fechaLlegada: toApiDateTime(datos.fechaLlegada),
      precio: Number(datos.precio),
      cantidadAsientos: Number(datos.cantidadAsientos),
      ...(editando
        ? { estado: Number(datos.estado) }
        : { cantidadAsientosEjecutivos: Number(datos.cantidadAsientosEjecutivos || 0) }),
    };

    try {
      await onGuardar(dto);
    } catch (error) {
      const deCampo = Object.entries(error.fieldErrors ?? {}).filter(([campo]) => CAMPOS.includes(campo));

      if (deCampo.length > 0) {
        deCampo.forEach(([campo, mensajes]) => setError(campo, { type: 'server', message: mensajes[0] }));
      } else {
        setErrorEnvio(error);
      }
    }
  }

  return (
    <section
      aria-labelledby="formulario-vuelo"
      className="mt-8 rounded-control border border-line bg-surface-tint p-[clamp(20px,3vw,32px)]"
    >
      <h2 id="formulario-vuelo" className="m-0 text-app-section">
        {editando ? `Editar vuelo ${vuelo.numeroVuelo}` : 'Nuevo vuelo'}
      </h2>
      <p className="m-0 mt-1 text-app-body-sm text-ink-muted">
        {editando
          ? 'Si reducís la capacidad, no se pueden quitar asientos que ya tengan reservas.'
          : 'Los asientos se generan automáticamente (01, 02, …). Los primeros pueden ser ejecutivos.'}
      </p>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            label="Código"
            mono
            placeholder="AR1234"
            error={errors.codigo?.message}
            {...register('codigo', {
              validate: (valor) => valor.trim().length > 0 || 'Ingresá el código del vuelo.',
              maxLength: { value: 20, message: 'El código admite hasta 20 caracteres.' },
            })}
          />
          <FormField
            label="Origen"
            error={errors.origen?.message}
            {...register('origen', {
              validate: (valor) => valor.trim().length > 0 || 'Ingresá el origen.',
              maxLength: { value: 80, message: 'El origen admite hasta 80 caracteres.' },
            })}
          />
          <FormField
            label="Destino"
            error={errors.destino?.message}
            {...register('destino', {
              validate: (valor) => valor.trim().length > 0 || 'Ingresá el destino.',
              maxLength: { value: 80, message: 'El destino admite hasta 80 caracteres.' },
            })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Salida (hora local)"
            type="datetime-local"
            mono
            error={errors.fechaSalida?.message}
            {...register('fechaSalida', {
              required: 'Ingresá la fecha y hora de salida.',
              // Igual que CrearVueloDTO: al crear, la salida tiene que ser futura.
              validate: (valor) => editando || new Date(valor) > new Date() || 'La fecha de salida debe ser futura.',
            })}
          />
          <FormField
            label="Llegada (hora local)"
            type="datetime-local"
            mono
            error={errors.fechaLlegada?.message}
            {...register('fechaLlegada', {
              required: 'Ingresá la fecha y hora de llegada.',
              validate: (valor) => {
                const salida = getValues('fechaSalida');
                return !salida || new Date(valor) > new Date(salida) || 'La llegada debe ser posterior a la salida.';
              },
            })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            label="Precio base (ARS)"
            type="number"
            mono
            min="0"
            step="0.01"
            inputMode="decimal"
            error={errors.precio?.message}
            {...register('precio', {
              required: 'Ingresá el precio.',
              min: { value: 0, message: 'El precio no puede ser negativo.' },
              max: { value: 10000000, message: 'El precio debe estar entre 0 y 10.000.000.' },
            })}
          />
          <FormField
            label="Cantidad de asientos"
            type="number"
            mono
            min="1"
            max="500"
            step="1"
            inputMode="numeric"
            error={errors.cantidadAsientos?.message}
            {...register('cantidadAsientos', {
              required: 'Ingresá la cantidad de asientos.',
              validate: (valor) =>
                (Number.isInteger(Number(valor)) && Number(valor) >= 1 && Number(valor) <= 500) ||
                'La cantidad de asientos debe estar entre 1 y 500.',
            })}
          />
          {editando ? (
            <FormField label="Estado" control="select" error={errors.estado?.message} {...register('estado')}>
              {ESTADOS.map((estado) => (
                <option key={estado.codigo} value={estado.codigo}>
                  {estado.label}
                </option>
              ))}
            </FormField>
          ) : (
            <FormField
              label="Asientos ejecutivos"
              type="number"
              mono
              min="0"
              step="1"
              inputMode="numeric"
              optional
              error={errors.cantidadAsientosEjecutivos?.message}
              {...register('cantidadAsientosEjecutivos', {
                validate: (valor) => {
                  const ejecutivos = Number(valor || 0);
                  const total = Number(getValues('cantidadAsientos') || 0);
                  return (
                    (Number.isInteger(ejecutivos) && ejecutivos >= 0 && ejecutivos <= total) ||
                    'No puede superar la cantidad total de asientos.'
                  );
                },
              })}
            />
          )}
        </div>

        {errorEnvio && (
          <ErrorMessage error={errorEnvio} title={editando ? 'No pudimos guardar el vuelo' : 'No pudimos crear el vuelo'} />
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onCancelar} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" pending={isSubmitting} pendingLabel="Guardando…">
            {editando ? 'Guardar cambios' : 'Crear vuelo'}
          </Button>
        </div>
      </form>
    </section>
  );
}
