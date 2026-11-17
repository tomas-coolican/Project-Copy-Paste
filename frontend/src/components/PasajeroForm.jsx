import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from './Button.jsx';
import FormField from './FormField.jsx';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VACIOS = { nombre: '', apellido: '', dni: '', email: '', telefono: '' };

/**
 * Formulario de pasajero (reutilizable). Límites del backend: nombre y apellido ≤ 60, dni ≤ 20,
 * email ≤ 120, teléfono opcional ≤ 30.
 * - `onSubmit(valores)`: recibe los datos ya recortados; el teléfono vacío no se envía.
 * - `serverErrors`: { campo: mensaje } para marcar errores del servidor (por ejemplo 409 de DNI repetido).
 * - `submitLabel`: si se pasa, el formulario trae su propio botón; si no, se envía desde afuera con
 *   `<Button type="submit" form={formId}>`.
 */
export default function PasajeroForm({
  formId = 'pasajero-form',
  defaultValues,
  serverErrors,
  submitLabel,
  pendingLabel = 'Guardando…',
  pending = false,
  onSubmit,
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ mode: 'onBlur', defaultValues: { ...VACIOS, ...defaultValues } });

  useEffect(() => {
    Object.entries(serverErrors ?? {}).forEach(([campo, mensaje], indice) => {
      setError(campo, { type: 'server', message: mensaje }, { shouldFocus: indice === 0 });
    });
  }, [serverErrors, setError]);

  function enviar(datos) {
    const telefono = datos.telefono.trim();

    return onSubmit({
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      dni: datos.dni.trim(),
      email: datos.email.trim(),
      ...(telefono ? { telefono } : {}),
    });
  }

  return (
    <form id={formId} noValidate onSubmit={handleSubmit(enviar)} className="grid gap-4 tbl:grid-cols-2">
      <FormField
        label="Nombre"
        autoComplete="given-name"
        error={errors.nombre?.message}
        {...register('nombre', {
          required: 'Ingresá el nombre.',
          maxLength: { value: 60, message: 'El nombre admite hasta 60 caracteres.' },
        })}
      />
      <FormField
        label="Apellido"
        autoComplete="family-name"
        error={errors.apellido?.message}
        {...register('apellido', {
          required: 'Ingresá el apellido.',
          maxLength: { value: 60, message: 'El apellido admite hasta 60 caracteres.' },
        })}
      />
      <FormField
        label="DNI"
        mono
        inputMode="numeric"
        error={errors.dni?.message}
        {...register('dni', {
          required: 'Ingresá el DNI.',
          maxLength: { value: 20, message: 'El DNI admite hasta 20 caracteres.' },
          pattern: {
            value: /^[A-Za-z0-9]{6,20}$/,
            message: 'El DNI debe tener entre 6 y 20 letras o números, sin puntos ni espacios.',
          },
        })}
      />
      <FormField
        label="Teléfono"
        type="tel"
        mono
        optional
        autoComplete="tel"
        error={errors.telefono?.message}
        {...register('telefono', { maxLength: { value: 30, message: 'El teléfono admite hasta 30 caracteres.' } })}
      />
      <FormField
        label="Email"
        type="email"
        autoComplete="email"
        className="tbl:col-span-2"
        error={errors.email?.message}
        {...register('email', {
          required: 'Ingresá el email.',
          maxLength: { value: 120, message: 'El email admite hasta 120 caracteres.' },
          pattern: { value: EMAIL_VALIDO, message: 'Revisá el formato del email.' },
        })}
      />

      {submitLabel && (
        <div className="tbl:col-span-2">
          <Button type="submit" pending={pending} pendingLabel={pendingLabel}>
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
