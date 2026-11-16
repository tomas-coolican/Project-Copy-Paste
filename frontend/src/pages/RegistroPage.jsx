import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthTabs from '../components/AuthTabs.jsx';
import Button from '../components/Button.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import FormField from '../components/FormField.jsx';
import useAuth from '../hooks/useAuth.js';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CAMPOS = ['nombre', 'email', 'password'];

export default function RegistroPage() {
  const { registrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [invalidos, setInvalidos] = useState(0);
  const from = location.state?.from;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onBlur', defaultValues: { nombre: '', email: '', password: '' } });

  async function onSubmit(datos) {
    setErrorGeneral(null);
    setInvalidos(0);

    try {
      await registrar({ nombre: datos.nombre.trim(), email: datos.email.trim(), password: datos.password });
      navigate(from ?? '/dashboard', { replace: true });
    } catch (error) {
      const camposConError = CAMPOS.filter((campo) => error.fieldErrors?.[campo]);

      if (camposConError.length > 0) {
        camposConError.forEach((campo, indice) =>
          setError(campo, { type: 'server', message: error.fieldErrors[campo][0] }, { shouldFocus: indice === 0 }),
        );
      } else if (error.status === 409) {
        // Email ya registrado: queda bajo el campo.
        setError('email', { type: 'server', message: error.message }, { shouldFocus: true });
      } else {
        setErrorGeneral(error);
      }
    }
  }

  return (
    <>
      <h1 className="m-0 text-app-page font-bold">Creá tu cuenta</h1>
      <p className="m-0 mt-2 text-app-body-sm text-ink-muted">Nombre, email y contraseña. Al terminar ya iniciás sesión.</p>

      <AuthTabs state={from ? { from } : undefined} />

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit, (fallas) => setInvalidos(Object.keys(fallas).length))}
        className="mt-6 flex flex-col gap-4"
      >
        <FormField
          label="Nombre"
          autoComplete="name"
          error={errors.nombre?.message}
          {...register('nombre', {
            required: 'Ingresá tu nombre.',
            maxLength: { value: 80, message: 'El nombre admite hasta 80 caracteres.' },
          })}
        />
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', {
            required: 'Ingresá tu email.',
            maxLength: { value: 120, message: 'El email admite hasta 120 caracteres.' },
            pattern: { value: EMAIL_VALIDO, message: 'Revisá el formato del email.' },
          })}
        />
        <FormField
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          help="Entre 8 y 72 caracteres."
          error={errors.password?.message}
          {...register('password', {
            required: 'Ingresá una contraseña.',
            minLength: { value: 8, message: 'La contraseña necesita al menos 8 caracteres.' },
            maxLength: { value: 72, message: 'La contraseña admite hasta 72 caracteres.' },
          })}
        />

        <p role="status" className="sr-only">
          {invalidos > 0 ? `Revisá ${invalidos} ${invalidos === 1 ? 'campo' : 'campos'}` : ''}
        </p>

        {errorGeneral && <ErrorMessage error={errorGeneral} title="No pudimos crear la cuenta" />}

        <Button type="submit" className="w-full" pending={isSubmitting} pendingLabel="Creando cuenta…">
          Crear cuenta
        </Button>
      </form>
    </>
  );
}
